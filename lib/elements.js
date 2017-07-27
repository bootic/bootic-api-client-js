const debug  = require('debug')('bootic')
const extend = Object.assign || require('util')._extend

const LINK_PREFIX = 'btc:'

function explain(el) {
  return function explain(opts) {
    console.log('Class: ' + el.constructor.name + ', ' + (el.loaded ? 'loaded' : 'not loaded'))
    if (el._data) console.log('\n ----> Data\n', el._data)
    if (el._links) console.log('\n ----> Links\n', el._links)
    if (el._embedded) console.log('\n ----> Embedded\n', el._embedded)
  }
}

// promise vs callback wrapper
function invoke(fn, cb) {
  if (cb)
    return fn(cb)

  return new Promise(function(resolve, reject) {
    fn(resolve)
  })
}

////////////////////////////////////////////////////////////////
// the base Element object

function Element(client, data) {
  this._client   = client
  this._data     = data || {}
  this._links    = this._data._links
  this._embedded = this._data._embedded
  this.loaded    = true
}

Element.prototype.explain = function() {
  return explain(this)
}

Element.prototype.hasAttr = function(name) {
  return this._data.hasOwnProperty(name)
}

Element.prototype.hasLink = function(path) {
  return this._links && this._links[LINK_PREFIX + path]
}

Element.prototype.hasEmbedded = function(name) {
  return this._embedded && this._embedded[name]
}

////////////////////////////////////////////////////////////////
// Collection: group of elements embedded in a loaded Element (e.g. root.shops)

function Collection(client, items) {
  this.loaded    = true
  this._client = client
  this._items  = items.map(function(i) {
    return new Proxy(new Element(client, i), proxyHandler)
  })

  // Element.call(this, client, {})
}

Collection.prototype = Object.create(Element.prototype)

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
    this._params['sort'] = by
    return this.proxy
  }.bind(this)
}

Collection.prototype.each = function() {
  return function each(cb) {
    return invoke(function(done) {
      this.fetchItems(function(items) {
        items.forEach(function(i, n) { cb(i, n) })
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
        cb(items[0], self._client)
      })
    }.bind(this), cb)
  }.bind(this)

  return new Proxy(fn, functionProxy)
}

Collection.prototype.last = function() {
  var fn = function last(cb) {
    var self = this
    return invoke(function(done) {
      return this.fetchItems(function(items) {
        cb(items[items.length-1], self._client)
      })
    }.bind(this), cb)
  }.bind(this)

  return new Proxy(fn, functionProxy)
}

////////////////////////////////////////////////////////////////
// LinkedAction (for non-GET links, e.g. shop._links.create_product)

function LinkedAction(client, link) {
  return function(params) {
    return client.request(link, params)
  }
}

////////////////////////////////////////////////////////////////
// LinkedElement (singular GET link, e.g. shop._links.theme)

function LinkedElement(client, link) {
  this._client = client
  this._link = link
  this.loaded = false
}

LinkedElement.prototype = Object.create(Element.prototype)

LinkedElement.prototype.get = function(cb) {
  if (this._data)
    return cb(this._data)

  return this._client.request(this._link, {}).then(function(data) {
    this.loaded = true
    cb(this._data = data)
  }.bind(this))
}

////////////////////////////////////////////////////////////////
// LinkedCollection (plural GET link, e.g. shop._links.products)

function LinkedCollection(client, link, singular_link) {
  Element.call(this, client, {})

  this.loaded = false
  this._params = {}
  this._link = link
  this._singular_link = singular_link
}

LinkedCollection.prototype = Object.create(Collection.prototype)

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

  var client = this._client
  return this.fetch(function(result) {
    this._items = result._embedded.items.map(function(i) {
      return new Proxy(new Element(client, i), proxyHandler)
    })

    cb(this._items)
  }.bind(this))
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
  this._path   = path
  this._data   = {}
  this._params = {}
  this._pendingFn = pendingFn
}

VirtualElement.prototype = Object.create(Element.prototype)

VirtualElement.prototype.get = function() {
  return function get(cb) {
    if (this.result)
      return cb(this.result)

    var self = this
    return this._pendingFn(function(parent, client) {
      self._client = client

      if (parent._embedded[self._path]) {

        if (self._path[self._path.length-1] == 's')
          var res = { _embedded: { items: parent._embedded[self._path] } }
        else
          var res = new Element(client, parent._embedded[self._path]);

        return cb(res)
      }

      var link = parent._links[LINK_PREFIX + self._path]
      if (!link) throw new Error('Invalid link: ' + self._path + ', available: ', Object.keys(parent._links))

      return self._client.request(link, self._params).then(function(result) {
        self.loaded = true
        self.result = new Proxy(new Element(client, result), proxyHandler)
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
  // this._client = client
  this._path   = path
  this._data   = {}
  this._params = {}
  this._pendingFn = pendingFn
  // Element.call(this, client, {})
}

VirtualCollection.prototype = Object.create(LinkedCollection.prototype)

VirtualCollection.prototype.fetch = function(cb) {
  var fn = VirtualElement.prototype.get.call(this)
  return fn(cb)
}

////////////////////////////////////////////////////////////////
// proxy builders and handlers

function buildEmbeddedProxy(target, name) {
  if (name[name.length-1] == 's') { // plural, assume collection
    var target = new Collection(target._client, target._embedded[name])
  } else {
    var target = new Element(target._client, target._embedded[name])
  }

  var proxy = new Proxy(target, proxyHandler)
  target.proxy = proxy
  return proxy
}

function buildLinkProxy(target, name, link) {
  if (link.method && link.method.toLowerCase() != 'get') {
    return new LinkedAction(target._client, link)
  }

  if (name[name.length-1] != 's') // singular, not a collection
    return new LinkedElement(target._client, link)

  // plural, assume collection
  // let's see if there's a singular version of this resource
  var singular = target._links[LINK_PREFIX + name.substring(0, name.length-1)]
  var target   = new LinkedCollection(target._client, link, singular)

  var proxy    = new Proxy(target, proxyHandler)
  target.proxy = proxy
  return proxy
}

let functionProxy = {
  get: function(target, name) {
    if (name == 'explain')
      return explain(target)

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

    if (typeof name == 'symbol' || name.toString().match(/inspect|valueOf|toString/)) {
      return function() { return target.constructor.name }
    } else if (name.toString().match(/then/)) {
      return
    }

    if (target.hasAttr(name)) {
      debug('Found attribute:', name)
      return target._data[name]
    }

    if (name != 'shops' && target.hasEmbedded(name)) { // found embedded
      debug('Found embedded:', name)
      return buildEmbeddedProxy(target, name);
    }

    if (target.hasLink(name) || target.hasLink('all_' + name)) {
      var link = target._links[LINK_PREFIX + 'all_' + name] || target._links[LINK_PREFIX + name]
      debug('Found link:', name, link)
      return buildLinkProxy(target, name, link);
    }

    if (typeof target[name] == 'function') { // method exists
      debug('Found method:', name)
      return target[name].call(target)
    }

    throw new Error(name + ' not found in ' + target.constructor.name)
  }
}

////////////////////////////////////////////////////////////////
// the root exports

exports.root = function(client, data) {
  var target  = new Element(client, data)
  return new Proxy(target, proxyHandler)
}