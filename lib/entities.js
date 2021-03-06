const debug   = require('debug')('bootic');
const explain = require('./explain');
const h       = require('./helpers');

const LINK_PREFIX = 'btc:';

// promise vs callback wrapper
function invoke(fn, cb) {
  if (cb) {
    fn(cb); return; // return nil, not function's result
  }

  return new Promise(function(resolve, reject) {
    return fn(resolve)
  })
}

////////////////////////////////////////////////////////////////
// PagedArray is used when fetching collections. it's simply
// an array with an methods to fetch prev/next pages.

function buildPagedArray(itemName, client, result) {
  var links    = result._links;
  var itemsArr = result._embedded && result._embedded.items;
  if (!itemsArr)
    throw new Error('This link doesnt have embedded items!')

  var arr = itemsArr.map(function(item) {
    return new Proxy(new Entity(itemName, client, item), proxyHandler)
  })

  function requestPage(link, cb) {
    return invoke(function(done) {
      return client.request(link, {}).then(function(result) {
        debug('Got result', JSON.stringify(result, null, 2));
        var arr = buildPagedArray(itemName, client, result);
        done(arr);
      })
    }, cb)
  }

  Object.defineProperties(arr, {
    'totalItems': {
      get: function() { return result.total_items }
    },
    'hasPrevPage': {
      get: function() { return !!links.prev }
    },
    'hasNextPage': {
      get: function() { return !!links.next }
    },
    'hasLastPage': {
      get: function() { return !!links.last }
    },
    'prevPage': {
      get: function() {
        return function(cb) {
          return requestPage(links.prev, cb)
        }
      }
    },
    'nextPage': {
      get: function() {
        return function(cb) {
          return requestPage(links.next, cb)
        }
      }
    },
    'lastPage': {
      get: function() {
        return function(cb) {
          return requestPage(links.last, cb)
        }
      }
    }
  })

  return arr;
}

////////////////////////////////////////////////////////////////
// the base Entity object

function Entity(name, client, data) {
  if (!client || !data)
    throw new TypeError('Both client and data required.')

  this._name      = name
  this._client   = client
  this._data     = data || {}
  this._links    = this._data._links
  this._embedded = this._data._embedded
  // this.loaded    = true
}

Entity.prototype._fetch = function(cb) {
  return cb(this)
}

Entity.prototype.get = function() {
  return function get(cb) {
    return invoke(function(done) {
      this._fetch(done)
    }.bind(this))
  }
}

Entity.prototype.explain = function(opts) {
  var fn = explain(this)
  return fn(opts)
}

Entity.prototype.hasAttr = function(name) {
  return (this._data || {}).hasOwnProperty(name)
}

Entity.prototype.getAttr = function(name) {
  return this._data[name];
}

Entity.prototype.hasLink = function(name, matchAll) {
  return !!this.getLink(name, matchAll);
}

Entity.prototype.getLink = function(name, matchAll) {
  return this._links && ((matchAll && this._links[LINK_PREFIX + 'all_' + name]) || this._links[LINK_PREFIX + name]);
}

Entity.prototype.hasEmbedded = function(name) {
  return !!this.getEmbedded(name);
}

Entity.prototype.getEmbedded = function(name) {
  return this._embedded && this._embedded[name]
}

////////////////////////////////////////////////////////////////
// Collection: group of Entities embedded in a loaded Entity (e.g. root.shops)

function Collection(name, client, items) {
  // this.loaded  = true
  this._name    = name
  this._client = client
  this._params = {}

  var itemName = name.replace(/e?s$/, '');
  this._items  = items.map(function(i) {
    return new Proxy(new Entity(itemName, client, i), proxyHandler)
  })

  // allow accesing items directly via coll.items
  this.items = this._items;
}

Collection.prototype = Object.create(Entity.prototype)
Collection.prototype.constructor = Collection

Collection.prototype.length = function() {
  if (!this._items)
    throw new Error('Linked items not loaded yet!')

  return this._items.length;
}

Collection.prototype._fetchItems = function(cb) {
  if (!this._params || Object.keys(this._params).length == 0)
    return cb(this._items)

  var params = this._params;
  var subset = this._items.filter(function(el) {
    for (var key in params) {
      if (el[key] && el[key] == params[key])
        return true
    }
  })

  cb(subset)
}

Collection.prototype.find = function(id, cb) {
  if (!id) throw new Error('ID required');

  return invoke(function(done) {
    var found = this._items.filter(function(el) {
      return String(el.id) == String(id)
    })

    if (found.length == 1)
      return done(found[0])
    else if (found.length > 1)
      throw new Error('More than one Entity found with ID ' + id);
    else
      // throw new Error('No Entity found with ID ' + id);
      return done(); // not found

  }.bind(this), cb)
}

/*
Collection.prototype.resetFilters = function() {
  this._params = {};
  return this.proxy;
}
*/

Collection.prototype.where = function(params) {
  if (!params || !h.isObject(params))
    throw new Error('Object expected, not ' + typeof(params));

  this._params = params;
  // extend(this._params, params);
  return this.proxy;
}

Collection.prototype.sort = function(by) {
  // TODO
  return this.proxy
}

Collection.prototype.each = function(cb, after) {
  if (!cb) throw new TypeError('Callback required!')

  return this._fetchItems(function(items) {
    items.forEach(function(i, n) { cb(i, n) })
    if (after) after()
  })
}

Collection.prototype.all = function(cb) {
  return invoke(function(done) {
    this._fetchItems(function(items) { done(items) })
  }.bind(this), cb)
}

Collection.prototype.first = function(num, cb) {
  cb  = h.isFunction(num) ? num : cb;
  num = h.isNumber(num) ? num : null;

  return invoke(function(done) {
    this._fetchItems(function(items) {
      done(num ? items.slice(num) : items[0])
    })
  }.bind(this), cb)
}

Collection.prototype.last = function(num, cb) {
  cb  = h.isFunction(num) ? num : cb;
  num = h.isNumber(num) ? num : null;

  return invoke(function(done) {
    this._fetchItems(function(items) {
      done(num ? items.slice(num * -1) : items[items.length-1])
    })
  }.bind(this), cb)
}

// array-like behaviour

Collection.prototype.map = function(cb) {
  if (!this._items)
    throw new Error('Linked items not loaded yet!')

  return this._items.map(cb);
}

Collection.prototype.forEach = function(cb) {
  if (!this._items)
    throw new Error('Linked items not loaded yet!')

  return this._items.forEach(cb);
}

////////////////////////////////////////////////////////////////
// LinkedAction (for non-GET links, e.g. shop._links.create_product)

function LinkedAction(name, client, link) {
  this._name = name;

  var fn = function(params, cb) {
    return invoke(function(done) {
      return client.request(link, params).then(function(result) {
        done(detectProxy(client, result))
      })
    }.bind(this), cb);
  }

  fn.constructor = LinkedAction;
  fn.explain = function() {
    console.log(('\n link:' + name).blue + '\n')
    console.log(link);
  }

  return fn;
}

////////////////////////////////////////////////////////////////
// LinkedEntity (singular GET link, e.g. shop._links.theme)

function LinkedEntity(name, client, link) {
  this._client = client
  this._link = link
  this._name   = name
  // this.loaded = false
}

LinkedEntity.prototype = Object.create(Entity.prototype)
LinkedEntity.prototype.constructor = LinkedEntity

LinkedEntity.prototype.get = function(params, cb) {
  cb = h.isFunction(params) ? params : cb;
  params = h.isObject(params) ? params : {};

  return invoke(function(done) {
    return this._client.request(this._link, params).then(function(result) {
      debug('Got result', JSON.stringify(result, null, 2));
      // this.loaded = true
      this._data = result

      var proxy = new Proxy(new Entity(this._name, this._client, result), proxyHandler)
      done(proxy)
    }.bind(this))
  }.bind(this))
}

////////////////////////////////////////////////////////////////
// LinkedCollection (plural GET link, e.g. shop._links.products)

function LinkedCollection(name, client, link, singular_link) {
  Entity.call(this, name, client, {})

  // this.loaded = false
  this._params = {}
  this._link = link
  this._singular_link = singular_link
}

LinkedCollection.prototype = Object.create(Collection.prototype)
LinkedCollection.prototype.constructor = LinkedCollection

LinkedCollection.prototype._fetch = function(cb) {
  if (this.result && !Object.keys(this._params).length)
    return cb(this.result)

  return this._client.request(this._link, this._params).then(function(result) {
    // this.loaded = true
    debug('Got result', JSON.stringify(result, null, 2));
    cb(this.result = result)
  }.bind(this))
}

LinkedCollection.prototype._fetchItems = function(cb) {
  var client   = this._client,
      itemName = this._name.replace(/e?s$/, '')

  return this._fetch(function(result) {
    if (!result._class.indexOf('errors'))
      throw new Error(result.message);

    this._items = buildPagedArray(itemName, client, result);
    cb(this._items)

  }.bind(this))
}

// returns an Entity wrapping the linked response.
// useful for things that look like a collection but aren't
// like shop.themes.
LinkedCollection.prototype.get = function(cb) {
  return invoke(function(done) {
    return this._fetch(function(res) {
      var Entity = new Entity(this._name, this._client, res);
      var proxy = new Proxy(Entity, proxyHandler)
      done(proxy)
    }.bind(this));
  }.bind(this), cb)
}

LinkedCollection.prototype.sort = function(by) {
  this._params['sort'] = by
  return this.proxy
}

LinkedCollection.prototype.find = function(id, cb) {
  if (!id) throw new Error('ID required');

  return invoke(function(done) {
    // if there's a singular version, use that link.
    var link = this._singular_link || this._link
    this._client.request(link, { id: id }).then(function(result) {
      var proxy = embeddedProxy(this._client, result._class[0], result);
      done(proxy);
    }.bind(this))
  }.bind(this), cb)
}

LinkedCollection.prototype.limit = function(count) {
  this._params['per_page'] = count;
  return this.proxy;
}

LinkedCollection.prototype.asc = function(count) {
  this.sort('created_on.asc');
  return this.proxy;
}

LinkedCollection.prototype.desc = function(count) {
  this.sort('created_on.desc');
  return this.proxy;
}

LinkedCollection.prototype.first = function(num, cb) {
  this.asc();
  if (h.isNumber(num)) this.limit(num);
  return Collection.prototype.first.call(this, num, cb);
}

LinkedCollection.prototype.last = function(num, cb) {
  this.desc();
  if (h.isNumber(num)) this.limit(num);
  return Collection.prototype.last.call(this, num, cb);
}

// array-like behaviour

LinkedCollection.prototype.map = function(cb) {
  if (!this._items)
    throw new Error('Linked items not loaded yet!')

  return this._items.map(cb);
}

LinkedCollection.prototype.forEach = function(cb) {
  if (!this._items)
    throw new Error('Linked items not loaded yet!')

  return this._items.forEach(cb);
}

////////////////////////////////////////////////////////////////
// VirtualEntity: singular Entity requested on a not-loaded Entity
//
// e.g. shop.orders.first.contact
//    - orders is a not-loaded linked collection
//    - contact is a virtual Entity

/*

function VirtualEntity(path, pendingFn) {
  if (!path || !pendingFn)
    throw new Error('Path and fn required')

  this._name    = path
  this._path   = path
  this._data   = {}
  this._params = {}
  this._pendingFn = pendingFn
  this._client = pendingFn.client
}

VirtualEntity.prototype = Object.create(Entity.prototype)
VirtualEntity.prototype.constructor = VirtualEntity

VirtualEntity.prototype.get = function() {
  return function get(cb) {
    if (this.result)
      return cb(this.result)

    var self = this, path = self._path, client = this._client
    return this._pendingFn(function(parent) {

      if (parent.hasEmbedded(path)) {
        if (path[path.length-1] == 's')
          var res = { _embedded: { items: parent.getEmbedded(path) } }
        else
          var res = new Entity(path, client, parent.getEmbedded(path))

        return cb(res)
      }

      var link = parent.getLink(path);
      if (!link)
        throw new Error(path + 'not found in ' + parent.constructor)

      return client.request(link, self._params).then(function(result) {
        self.loaded = true
        self.result = new Proxy(new Entity(path, client, result), proxyHandler)
        cb(self.result)
      }.bind(this))

    })
  }.bind(this)
}

////////////////////////////////////////////////////////////////
// VirtualCollection: plural Entity requested on a not-loaded Entity
//
// e.g. shop.orders.first.items
//    - orders is a not-loaded linked collection
//    - items is a virtual collection

function VirtualCollection(path, pendingFn) {
  this._name    = path
  this._path   = path
  this._data   = {}
  this._params = {}
  this._pendingFn = pendingFn
  this._client = pendingFn.client
}

VirtualCollection.prototype = Object.create(LinkedCollection.prototype)
VirtualCollection.prototype.constructor = VirtualCollection

VirtualCollection.prototype._fetch = function(cb) {
  var fn = VirtualEntity.prototype.get.call(this)
  return fn(cb)
}

*/

////////////////////////////////////////////////////////////////
// proxy builders and handlers
// TODO: less duplication, if possible.

function embeddedProxy(client, name, data) {
  if (h.isArray(data)) {
    var target = new Collection(name, client, data)
  } else {
    var target = new Entity(name, client, data)
  }

  var proxy = new Proxy(target, proxyHandler)
  target.proxy = proxy
  return proxy
}

function detectProxy(client, data, defaultName) {
  var name = data.class && data.class[0] || 'result';
  if (data._embedded && data._embedded.items) {
    return embeddedProxy(client, name, data._embedded.items)
  } else {
    return embeddedProxy(client, name, data)
  }
}

function linkedProxy(client, name, link, singular) {
  if (link.type || h.containsVerb(name) || (link.method && link.method.toLowerCase() != 'get'))
    return new LinkedAction(name, client, link)

  if (name[name.length-1] != 's') // singular, not a collection
    var target = new LinkedEntity(name, client, link)
  else // looks like a collection. we'll see if there's a singular version of this resource
    var target   = new LinkedCollection(name, client, link, singular)

  var proxy    = new Proxy(target, proxyHandler)
  target.proxy = proxy
  return proxy
}


/*
let functionProxy = {
  get: function(target, name) {
    // var resp = handleInspection(target, name);
    // if (resp !== null) return resp;
    debug('Looking for ', name)
    if (target[name])
      return target[name];

    if (name[name.length-1] == 's')
      var obj = new VirtualCollection(name, target)
    else
      var obj = new VirtualEntity(name, target)

    var proxy = new Proxy(obj, proxyHandler)
    obj.proxy = proxy
    return proxy
  }
}
*/

let proxyHandler = {
  get: function(target, name) {
    if (typeof name == 'symbol')
      return function() { return [target.constructor.name, target._name].join(':') }
    else if (target[name]) // attrs, etc
      return target[name];

    if (target.hasAttr(name)) {
      debug('Found attribute:', name)
      return target.getAttr(name);
    }

    if (target.hasEmbedded(name)) {
      debug('Found embedded:', name)
      return embeddedProxy(target._client, name, target.getEmbedded(name))
    }

    if (target.hasLink(name, true)) {
      var link = target.getLink(name, true);
      debug('Found link:', name, link)

      var singular = target.getLink(name.substring(0, name.length-1))
      return linkedProxy(target._client, name, link, singular)
    }

    // throw new Error(name + ' not found in ' + target.constructor.name)
  }
}

////////////////////////////////////////////////////////////////
// the root exports

exports.root = function(client, data) {
  if (data && (data._links || {})['btc:all_shops'] && (data._embedded || {})['shops'])
    delete data._embedded['shops'] // so root.shops returns 'all_shops' link

  var target  = new Entity('root', client, data)
  return new Proxy(target, proxyHandler)
}

exports.embeddedProxy = embeddedProxy;
exports.linkedProxy = linkedProxy;
