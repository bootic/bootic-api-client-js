var resp = require('./test/response');
var extend = Object.assign;

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
  return this._links && this._links['btc:' + path];
}

Element.prototype.hasEmbedded = function(name) {
  return this._embedded && this._embedded[name];
}

Element.prototype.addPath = function(path) {
  // this._paths.push(path);
}

function LinkedElement(client, link) {
  Element.call(this, client, {});
  this._link = link;
}

LinkedElement.prototype = Object.create(Element.prototype);

LinkedElement.prototype.get = function(cb) {
  return this._client.request(this._link, cb)
}

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

//////////////////////////////////////////////////////

function LinkedCollection(client, link) {
  Element.call(this, client, {});
  this._link = link;
  this._params = {};
  // this.addPath(path);  
}

LinkedCollection.prototype = Object.create(Element.prototype);

LinkedCollection.prototype.fetch = function(cb) {
  return this._client.request(this._link, this._params, cb)
}

LinkedCollection.prototype.where = function() {
  return function where(params) {
    extend(this._params, params);
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

EmbeddedCollection.prototype.where = function() {
  return function where(params) {
    var subset = this._items.filter(function(el) {
      for (var key in params) {
        if (el[key] && el[key] == params[key])
          return true;
      }
    });

    this._original_items = this._items;
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
      var link = target._links['btc:' + name];

      if (link.method && link.method.toLowerCase() != 'get')
        var target = new LinkedAction(target._client, link);
      else if (name[name.length-1] == 's') // plural, assume collection
        var target = new LinkedCollection(target._client, link);
      else
        var target = new LinkedElement(target.client, link);

      var proxy = new Proxy(target, proxyHandler);
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
    throw new Error('Not found: ' + path);
  }
}

function Finder(client, data) {
  this._data   = data;

  this._client = client;
  this._paths  = ['root'];
  this._cache  = {};
}

function Client(opts) {
  // var target = new Finder(this, resp);
  var target = new Element(this, resp);

  this.root = new Proxy(target, proxyHandler);
  // this.root = new Element(resp);
}

Client.prototype.request = function(link, params, cb) {
  cb([ 'one', 'two'])
}

// module.exports = Client;
var bootic = new Client();

// bootic is the root element. shops is an embedded collection
bootic.shops.where({ subdomain: 'www' }).first(function(shop) {
  console.log(' ---> Processing shop: ' + shop.subdomain);

  // linked element
  bootic.account.get(function(account) {

  })

  // linked collection, find by id. returns promise as it might fail
  bootic.shops.find('1234').then(function(shop) {

  })

  // linked collection
  shop.orders.find('abc123').then(function(o) { ... })

  shop
    .delete_order
    .with({ id: 123 })
    .then(function(result) {
    .catch(function(err) {
      // ...
    })
  })

  // a linked action
  shop.create_order.with({ foo: 'bar' }).run(function(result) {
    console.log(result);
  })

  // a linked collection. same API as embedded collections
  shop.products.first(function(product) {
    console.log(product.model)    
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

