const debug   = require('debug')('bootic')
const extend  = Object.assign || require('util')._extend
const explain = require('./explain')

const LINK_PREFIX = 'btc:'

function isObject(obj) {
  return typeof obj == 'object' && obj !== null
}

function isFunction(fn) {
  return typeof fn == 'function'
}

// promise vs callback wrapper
function invoke(fn, cb) {
  if (cb) return fn(cb)

  return new Promise(function(resolve, reject) {
    return fn(resolve)
  })
}

////////////////////////////////////////////////////////////////
// the base Element object

function Element(name, client, data) {
  if (!client || !data)
    throw new TypeError('Both client and data required.')

  this.name      = name
  this._client   = client
  this._data     = data || {}
  this._links    = this._data._links
  this._embedded = this._data._embedded
  this.loaded    = true
}

Element.prototype.get = function() {
  return function get(cb) {
    return invoke(function(done) {
      done(this);
    }.bind(this))
  }
}

Element.prototype.explain = function() {
  return explain(this)
}

Element.prototype.hasAttr = function(name) {
  return (this._data || {}).hasOwnProperty(name)
}

Element.prototype.getAttr = function(name) {
  return this._data[name];
}

Element.prototype.hasLink = function(name, matchAll) {
  return !!this.getLink(name, matchAll);
}

Element.prototype.getLink = function(name, matchAll) {
  return this._links && ((matchAll && this._links[LINK_PREFIX + 'all_' + name]) || this._links[LINK_PREFIX + name]);
}

Element.prototype.hasEmbedded = function(name) {
  return !!this.getEmbedded(name);
}

Element.prototype.getEmbedded = function(name) {
  return this._embedded && this._embedded[name]
}

// keep a reference for checking in our proxy handler
const BaseMethods = Object.keys(Element.prototype).concat('hasOwnProperty');

////////////////////////////////////////////////////////////////
// Collection: group of elements embedded in a loaded Element (e.g. root.shops)

function Collection(name, client, items) {
  this.loaded  = true
  this.name    = name
  this._client = client
  this._params = {}

  var itemName = name.replace(/s$/, '');
  this._items  = items.map(function(i) {
    return new Proxy(new Element(itemName, client, i), proxyHandler)
  })
}

Collection.prototype = Object.create(Element.prototype)
Collection.prototype.constructor = Collection

Collection.prototype.length = function() {
  return this._items.length;
}

Collection.prototype.fetchItems = function(cb) {
  if (!this._params || Object.keys(this._params).length == 0)
    return cb(this._items)

  var params = this._params
  var subset = this._items.filter(function(el) {
    for (var key in params) {
      if (el[key] && el[key] == params[key])
        return true
    }
  })

  cb(subset)
}

Collection.prototype.find = function(cb) {
  return function find(id) {
    return new Promise(function(resolve, reject) {
      var found = this._items.filter(function(el) {
        return el.id == id
      })[0]

      return found ? resolve(found) : reject(new Error('Not found'))
    }.bind(this))
  }.bind(this)
}

Collection.prototype.where = function() {
  return function where(params) {
    extend(this._params, params)
    return this.proxy
  }.bind(this)
}

Collection.prototype.sort = function() {
  return function sort(by) {
    // TODO
    return this.proxy
  }.bind(this)
}

Collection.prototype.each = function() {
  return function each(cb) {
    return invoke(function(done) {
      this.fetchItems(function(items) {
        items.forEach(function(i, n) { done(i, n) })
      })
    }.bind(this), cb)
  }.bind(this)
}

Collection.prototype.all = function() {
  return function all(cb) {
    return invoke(function(done) {
      this.fetchItems(function(items) { done(items) })
    }.bind(this), cb)
  }.bind(this)
}

Collection.prototype.first = function() {
  var fn = function first(cb) {
    var self = this
    return invoke(function(done) {
      return this.fetchItems(function(items) {
        done(items[0])
      })
    }.bind(this), cb)
  }.bind(this)

  fn.client = this._client
  return new Proxy(fn, functionProxy)
}

Collection.prototype.last = function() {
  var fn = function last(cb) {
    var self = this
    return invoke(function(done) {
      return this.fetchItems(function(items) {
        done(items[items.length-1])
      })
    }.bind(this), cb)
  }.bind(this)

  fn.client = this._client
  return new Proxy(fn, functionProxy)
}

////////////////////////////////////////////////////////////////
// LinkedAction (for non-GET links, e.g. shop._links.create_product)

function LinkedAction(name, client, link) {
  this.name = name;
  return function(params) {
    return client.request(link, params)
  }
}

////////////////////////////////////////////////////////////////
// LinkedElement (singular GET link, e.g. shop._links.theme)

function LinkedElement(name, client, link) {
  this._client = client
  this._link = link
  this.name   = name
  this.loaded = false
}

LinkedElement.prototype = Object.create(Element.prototype)
LinkedElement.prototype.constructor = LinkedElement

LinkedElement.prototype.get = function(params, cb) {
  params = isObject(params) ? params : {};
  cb = isFunction(params) ? params : cb;

  return invoke(function(done) {
    return this._client.request(this._link, params).then(function(data) {
      this.loaded = true
      done(this._data = data)
    }.bind(this))
  }.bind(this))
}

////////////////////////////////////////////////////////////////
// LinkedCollection (plural GET link, e.g. shop._links.products)

function LinkedCollection(name, client, link, singular_link) {
  Element.call(this, name, client, {})

  this.loaded = false
  this._params = {}
  this._link = link
  this._singular_link = singular_link
}

LinkedCollection.prototype = Object.create(Collection.prototype)
LinkedCollection.prototype.constructor = LinkedCollection

LinkedCollection.prototype.fetch = function(cb) {
  if (this.result)
    return cb(this.result)

  return this._client.request(this._link, this._params).then(function(result) {
    this.loaded = true
    cb(this.result = result)
  }.bind(this))
}

LinkedCollection.prototype.fetchItems = function(cb) {
  // if (this._items)
  //   return cb(this._items)

  var client = this._client, itemName = this.name.replace(/s$/, '')
  return this.fetch(function(result) {
    if (!result._class.indexOf('errors'))
      return cb(new Error(result.message));

    this._items = result._embedded.items.map(function(i) {
      return new Proxy(new Element(itemName, client, i), proxyHandler)
    })

    cb(this._items)
  }.bind(this))
}

LinkedCollection.prototype.sort = function() {
  return function sort(by) {
    this._params['sort'] = by
    return this.proxy
  }.bind(this)
}

LinkedCollection.prototype.find = function() {
  return function find(id) {
    // if there's a singular version, use that link.
    var link = this._singular_link || this._link
    return this._client.request(link, { id: id })
  }.bind(this)
}

////////////////////////////////////////////////////////////////
// VirtualElement: singular element requested on a not-loaded Element
//
// e.g. shop.orders.first.contact
//    - orders is a not-loaded linked collection
//    - contact is a virtual element

function VirtualElement(path, pendingFn) {
  if (!path || !pendingFn)
    throw new Error('Path and fn required')

  this.name    = path
  this._path   = path
  this._data   = {}
  this._params = {}
  this._pendingFn = pendingFn
  this._client = pendingFn.client
}

VirtualElement.prototype = Object.create(Element.prototype)
VirtualElement.prototype.constructor = VirtualElement

VirtualElement.prototype.get = function() {
  return function get(cb) {
    if (this.result)
      return cb(this.result)

    var self = this, path = self._path, client = this._client
    return this._pendingFn(function(parent) {

      if (parent.hasEmbedded(path)) {
        if (path[path.length-1] == 's')
          var res = { _embedded: { items: parent.getEmbedded(path) } }
        else
          var res = new Element(path, client, parent.getEmbedded(path))

        return cb(res)
      }

      var link = parent.getLink(path);
      if (!link)
        throw new Error(path + 'not found in ' + parent.constructor)

      return client.request(link, self._params).then(function(result) {
        self.loaded = true
        self.result = new Proxy(new Element(path, client, result), proxyHandler)
        cb(self.result)
      }.bind(this))

    })
  }.bind(this)
}

////////////////////////////////////////////////////////////////
// VirtualCollection: plural element requested on a not-loaded Element
//
// e.g. shop.orders.first.items
//    - orders is a not-loaded linked collection
//    - items is a virtual collection

function VirtualCollection(path, pendingFn) {
  this.name    = path
  this._path   = path
  this._data   = {}
  this._params = {}
  this._pendingFn = pendingFn
  this._client = pendingFn.client
}

VirtualCollection.prototype = Object.create(LinkedCollection.prototype)
VirtualCollection.prototype.constructor = VirtualCollection

VirtualCollection.prototype.fetch = function(cb) {
  var fn = VirtualElement.prototype.get.call(this)
  return fn(cb)
}

////////////////////////////////////////////////////////////////
// proxy builders and handlers
// TODO: less duplication, if possible.

function buildEmbeddedProxy(client, name, data) {
  if (name[name.length-1] == 's') { // plural, assume collection
    var target = new Collection(name, client, data)
  } else {
    var target = new Element(name, client, data)
  }

  var proxy = new Proxy(target, proxyHandler)
  target.proxy = proxy
  return proxy
}

function buildLinkProxy(client, name, link, singular) {
  if (link.method && link.method.toLowerCase() != 'get')
    return new LinkedAction(name, client, link)

  if (name[name.length-1] != 's') // singular, not a collection
    return new LinkedElement(name, client, link)

  // ok so we have a collection
  // let's see if there's a singular version of this resource
  var target   = new LinkedCollection(name, client, link, singular)
  var proxy    = new Proxy(target, proxyHandler)
  target.proxy = proxy
  return proxy
}

function handleInspection(target, name) {
  if (name == 'constructor')
    return target.constructor
  else if (typeof name == 'symbol' || name.toString().match(/inspect|valueOf|toString/))
    return function() { return [target.constructor.name, target.name].join(':') }
  else if (name.toString().match(/then/))
    return target.then
  else if (name == 'explain')
    return explain(target)
  else
    return null
}

let functionProxy = {
  get: function(target, name) {
    var resp = handleInspection(target, name);
    if (resp !== null) return resp;

    if (name[name.length-1] == 's')
      var obj = new VirtualCollection(name, target)
    else
      var obj = new VirtualElement(name, target)

    var proxy = new Proxy(obj, proxyHandler)
    obj.proxy = proxy
    return proxy
  }
}

let proxyHandler = {
  get: function(target, name) {
    var resp = handleInspection(target, name);
    if (resp !== null) return resp;

    if (~BaseMethods.indexOf(name)) // getAttr, hasLink, etc
      return target[name];

    if (typeof target[name] == 'function') { // method, e.g. collection.first()
      debug('Found method:', name)
      return target[name].call(target)
    }

    if (target.hasAttr(name)) {
      debug('Found attribute:', name)
      return target.getAttr(name);
    }

    if (target.hasEmbedded(name)) {
      debug('Found embedded:', name)
      return buildEmbeddedProxy(target._client, name, target.getEmbedded(name))
    }

    if (target.hasLink(name, true)) {
      var link = target.getLink(name, true);
      debug('Found link:', name, link)

      var singular = target.getLink(name.substring(0, name.length-1))
      return buildLinkProxy(target._client, name, link, singular)
    }

    throw new Error(name + ' not found in ' + target.constructor.name)
  }
}

////////////////////////////////////////////////////////////////
// the root exports

exports.root = function(client, data) {
  delete data._embedded['shops'] // so root.shops returns 'all_shops' link
  var target  = new Element('root', client, data)
  return new Proxy(target, proxyHandler)
}