var resp = require('./test/response');
var extend = Object.assign;
var link_prefix = 'btc:';

////////////////////////////////
//

function Element(client, data) {
  this._client   = client;
  this._data     = data;
  this._links    = data._links;
  this._embedded = data._embedded;
  // this._paths    = [];
}

Element.prototype.hasAttr = function(name) {
  return this._data.hasOwnProperty(name);
}

Element.prototype.hasLink = function(path) {
  return this._links && this._links[link_prefix + path];
}

Element.prototype.hasEmbedded = function(name) {
  return this._embedded && this._embedded[name];
}

// Element.prototype.addPath = function(path) {
  // this._paths.push(path);
// }

/*
function LinkedElement(client, link) {
  Element.call(this, client, {});
  this._link = link;
}

LinkedElement.prototype = Object.create(Element.prototype);

LinkedElement.prototype.get = function() {
  return this._client.request(this._link, cb)
}
*/

function LinkedElement(client, link) {
  this._client = client;
  this._link = link;
}

LinkedElement.prototype.get = function(cb) {
  return this._client.request(this._link, {}, cb)
}

/*
function LinkedAction(client, link) {
  // Element.call(this, client, {});
  this._data   = {};
  this._client = client;
  this._link   = link;
}

LinkedAction.prototype = Object.create(Element.prototype);

LinkedAction.prototype.with = function() {
  return function(params) {
    this._params = params;
    return this.proxy;
  }.bind(this)
}

LinkedAction.prototype.run = function() {
  return function run(cb) {
    return this._client.request(this._link, this._params, cb);
  }.bind(this)
}
*/

//////////////////////////////////////////////////////

function LinkedCollection(client, link, singular_link) {
  Element.call(this, client, {});
  this._params = {};
  this._link = link;
  this._singular_link = singular_link;
}

LinkedCollection.prototype = Object.create(Element.prototype);

LinkedCollection.prototype.fetch = function(cb) {
  return this._client.request(this._link, this._params, cb)
}

LinkedCollection.prototype.find = function() {
  return function find(id) {
    return new Promise(function(resolve, reject) {
      // if there's a singular version, use that link.
      var link = this._singular_link || this._link; 
      this._client.request(link, { id: id }, resolve, reject)
    }.bind(this))
  }.bind(this)
}

LinkedCollection.prototype.where = function() {
  return function where(params) {
    extend(this._params, params);
    return this.proxy;
  }.bind(this);
}

LinkedCollection.prototype.sort = function() {
  return function sort(by) {
    this._params['sort'] = by;
    return this.proxy;
  }.bind(this);
}

LinkedCollection.prototype.each = function() {
  return function each(cb) {
    return this.fetch(function(items) {
      console.log('xxx')
      items.forEach(function(i) { cb(i) });
    })
  }.bind(this)
}

LinkedCollection.prototype.all = function() {
  return function all(cb) {
    return this.fetch(function(items) {
      cb(items);
    })
  }.bind(this)
}

LinkedCollection.prototype.first = function() {
  return function first(cb) {
    return this.fetch(function(items) {
      cb(items[0]);
    })
  }.bind(this)
}

LinkedCollection.prototype.last = function() {
  return function last(cb) {
    return this.fetch(function(items) {
      cb(items[items.length-1]);
    })
  }.bind(this)  
}

function EmbeddedCollection(client, items) {
  this._items = items.map(function(i) { 
    return new Proxy(new Element(client, i), proxyHandler)
  });

  Element.call(this, client, {});
}

EmbeddedCollection.prototype = Object.create(LinkedCollection.prototype);

EmbeddedCollection.prototype.fetch = function(cb) {
  return cb(this._items);
}

EmbeddedCollection.prototype.find = function(cb) {
  return function find(id) {
    return new Promise(function(resolve, reject) {
      var found = this._items.filter(function(el) {
        return el.id == id;
      })[0];

      return found ? resolve(found) : reject(new Error('Not found'))
    }.bind(this))
  }.bind(this)
}

EmbeddedCollection.prototype.where = function() {
  return function where(params) {

    var subset = this._items.filter(function(el) {
      for (var key in params) {
        if (el[key] && el[key] == params[key])
          return true;
      }
    });

    if (!this._original_items) this._original_items = this._items;
    this._items = subset;
    return this.proxy;

    // var target = new EmbeddedCollection(this._client, subset);
    // return new Proxy(target, proxyHandler);

  }.bind(this)
}

/*
function EmbeddedItem(client, item) {
  this._client = client;
  this._item   = item;
}
*/

function LinkedAction(client, link) {
  return function(params) {
    return new Promise(function(resolve, reject) {
      client.request(link, params, resolve, reject);
    })
  }
}

let proxyHandler = {
  get: function(target, name) {
    if (name.toString().match(/inspect|valueOf|toStringTag/)) {
      return;
    }

    if (target.hasAttr(name)) { 
      console.log('Found attribute:', name);
      return target._data[name];
    }


    if (target.hasEmbedded(name)) { // found embedded
      console.log('Found embedded:', name);

      if (name[name.length-1] == 's') { // plural, assume collection
        var target = new EmbeddedCollection(target._client, target._embedded[name]);
      } else {
        var target = new Element(target.client, target._embedded[name]);
      }

      var proxy = new Proxy(target, proxyHandler);
      target.proxy = proxy;
      return proxy;
    }

    if (target.hasLink(name)) {
      console.log('Found link:', name);
      var link = target._links[link_prefix + name];

      if (link.method && link.method.toLowerCase() != 'get')
        return new LinkedAction(target._client, link);
      
      if (name[name.length-1] != 's') // singular, not a collection
        return new LinkedElement(target._client, link);

      // plural, assume collection
      // let's see if there's a singular version of this resource
      var singular = target._links[link_prefix + name.substring(0, name.length-1)];
      var target   = new LinkedCollection(target._client, link, singular);
      var proxy    = new Proxy(target, proxyHandler);
      target.proxy = proxy;
      return proxy;
    }

    if (typeof target[name] == 'function') { // method exists
      console.log('Found method:', name);
      return target[name].call(target);
    }

    // console.log('Method not found, adding path!', name);
    // target.addPath(name);
    // return new Proxy(target, proxyHandler);
    throw new Error('Not found: ' + name);
  }
}

function Client(opts) {
  // var target = new Finder(this, resp);
  var target = new Element(this, resp);

  this.root = new Proxy(target, proxyHandler);
  // this.root = new Element(resp);
}

Client.prototype.request = function(link, params, success, error) {
  success([ 'one', 'two'])
}

// module.exports = Client;
var c = new Client();
var bootic = c.root;

// bootic is the root element. shops is an embedded collection
bootic.shops.where({ subdomain: 'www' }).first(function(shop) {
  console.log(' ---> Processing shop: ' + shop.subdomain);

  // linked element
  shop.theme.get(function(theme) { 
    console.log('theme', theme)
  })

  // linked collection, find by id. returns promise as it might fail
  bootic.shops.find('1234').then(function(shop) {
    // ...
  }).catch(function(err) { 
    // console.log(err) 
  })

  // linked collection
  shop.orders.find('abc123').then(function(o) { 
    // ... 
  }).catch(function(err) { 
    // console.log(err) 
  })

  shop
    .create_product({ name: 'Some product' })
    .then(function(result) { })
    .catch(function(err) { })

  // a linked action
  shop.create_order({ foo: 'bar' }).then(function(result) {
    console.log(result);
  })

  // a linked collection. same API as embedded collections
  shop.products.first(function(product) {
    // product.make_visible().then(function(result) { })
  })

  // collections respond to .each, .map, .first, .last, and .where
  shop.products.each(function(p) { console.log(p.price) })

  // a linked collection (products), filtered and sorted
  shop
    .products
    .where({ price_lte: 30000 })
    .sort('price.desc')
    .last(function(product) {
      // ...
    })
})


function request(link, params, headers) {
  var options = {}, href = link.href;

  headers['Accept'] = 'application/json';
  headers['Content-Type'] = 'application/json';

  options.method  = link['method'] || 'get';
  options.headers = headers;

  if (link['templated']) {
    var template = uriTemplate(href);
    href = template.fill(params);

    template.varNames.forEach(function(v) {
      delete params[v]
    })
  }

  if (Object.keys(params).length > 0)
    options.body = JSON.stringify(params)

  return fetch(href, options);
}
