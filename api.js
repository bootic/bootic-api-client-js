// var resp = require('./test/response');

var uriTemplate = require('uri-templates');
// var urlTemplate = require('url-template');

var colour = require('colour');

if (typeof fetch == 'undefined') {
  var fetch = require('node-fetch-polyfill');
  require('http').globalAgent.keepAlive = true;
}

var extend = Object.assign;
var link_prefix = 'btc:';

var debugging = false;
// var debugging = true;
var debug = debugging ? console.log : function() { }

////////////////////////////////

function Element(client, data) {
  this._client   = client;
  this._data     = data;
  this._links    = data._links;
  this._embedded = data._embedded;
  this.loaded = true;
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
  this.loaded = false;
}

LinkedElement.prototype.get = function(cb) {
  if (this._data)
    return cb(this._data);

  return this._client.request(this._link, {}, function(data) {
    this.loaded = true;
    cb(this._data = data);
  }.bind(this))
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

  this.loaded = false;
  this._params = {};
  this._link = link;
  this._singular_link = singular_link;
}

LinkedCollection.prototype = Object.create(Element.prototype);

LinkedCollection.prototype.fetch = function(cb) {
  if (this.result)
    return cb(this.result);

  return this._client.request(this._link, this._params, function(result) {
    this.loaded = true;
    cb(this.result = result);
  }.bind(this))
}

LinkedCollection.prototype.fetchItems = function(cb) {
  // if (this._items)
  //   return cb(this._items);

  var client = this._client;
  return this.fetch(function(result) {
    this._items = result._embedded.items.map(function(i) {
      return new Proxy(new Element(client, i), proxyHandler)
    });

    cb(this._items)
  }.bind(this))
}

LinkedCollection.prototype.callAction = function(name) {
  var self = this;

  return function callAction(params) {
    return new Promise(function(resolve, reject) {
      self.fetch(function(result) {

        if (!result._actions[name])
          return reject(new Error('Action not found: ' + name + ', available are', Object.keys(result._actions)));

        var link = result._actions[name];
        return self._client.request(link, params, function(result) {

          if (result._embedded.items) {
            var obj = new Proxy(new EmbeddedCollection(self._client, result._embedded.items), proxyHandler)
          } else {
            var obj = new Proxy(new Element(self._client, result), proxyHandler)
          }

          resolve(obj);
        }, reject);
      })
    })
  }
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
    return this.fetchItems(function(items) {
      items.forEach(function(i, n) { cb(i, n) });
    })
  }.bind(this)
}

LinkedCollection.prototype.all = function() {
  return function all(cb) {
    return this.fetchItems(function(items) {
      cb(items);
    })
  }.bind(this)
}

LinkedCollection.prototype.first = function() {
  var fn = function first(cb) {
    var self = this;
    return this.fetchItems(function(items) {
      cb(items[0], self._client);
    })
  }.bind(this);

  return new Proxy(fn, functionProxy);
}

LinkedCollection.prototype.last = function() {
  var fn = function last(cb) {
    return this.fetchItems(function(items) {
      cb(items[items.length-1]);
    })
  }.bind(this);

  return new Proxy(fn, functionProxy);
}

function VirtualCollection(path, pendingFn) {
  // this._client = client;
  this._path = path;
  this._data = {};
  this._pendingFn = pendingFn;
  // Element.call(this, client, {});
}

VirtualCollection.prototype = Object.create(LinkedCollection.prototype);

VirtualCollection.prototype.fetch = function(cb) {
  if (this.result)
    return cb(this.result);

  var self = this;
  this._pendingFn(function(parentData, client) {
    self._client = client;

    var link = parentData._links[link_prefix + self._path];
    if (!link) throw new Error('Invalid path: ' + self._path);

    return self._client.request(link, {}, function(result) {
      self.loaded = true;
      cb(self.result = result);
    }.bind(this))
  })
}

var functionProxy = {
  get: function(target, name) {
    var obj = new VirtualCollection(name, target);
    return new Proxy(obj, proxyHandler);
  }
}

function EmbeddedCollection(client, items) {
  this._items = items.map(function(i) { 
    return new Proxy(new Element(client, i), proxyHandler)
  });

  Element.call(this, client, {});
}

EmbeddedCollection.prototype = Object.create(LinkedCollection.prototype);

EmbeddedCollection.prototype.fetchItems = function(cb) {
  if (!this._params || Object.keys(this._params).length == 0)
    return cb(this._items);

  var params = this._params;
  var subset = this._items.filter(function(el) {
    for (var key in params) {
      if (el[key] && el[key] == params[key])
        return true;
    }
  });

  cb(subset);
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

function LinkedAction(client, link) {
  return function(params) {
    return new Promise(function(resolve, reject) {
      client.request(link, params, resolve, reject);
    })
  }
}

let proxyHandler = {
  get: function(target, name) {
    if (name.toString().match(/inspect|then|valueOf|toStringTag/)) {
      return;
    }

    if (target.hasAttr(name)) { 
      debug('Found attribute:', name);
      return target._data[name];
    }

    if (name != 'shops' && target.hasEmbedded(name)) { // found embedded
      debug('Found embedded:', name);

      if (name[name.length-1] == 's') { // plural, assume collection
        var target = new EmbeddedCollection(target._client, target._embedded[name]);
      } else {
        var target = new Element(target.client, target._embedded[name]);
      }

      var proxy = new Proxy(target, proxyHandler);
      target.proxy = proxy;
      return proxy;
    }

    if (target.hasLink(name) || target.hasLink('all_' + name)) {

      var link = target._links[link_prefix + 'all_' + name] || target._links[link_prefix + name];
      debug('Found link:', name, link);

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
      debug('Found method:', name);
      return target[name].call(target);
    }

    if (!target.loaded) {
      debug('Method not found. Following path...', name);
      return target.callAction(name);
    } else {
      throw new Error('Not found: ' + name);
    }

    // target.addPath(name);
    // return new Proxy(target, proxyHandler);
  }
}

var ROOT_URL = 'https://api.bootic.net/v1';

function Client(opts) {
  this.rootUrl    = opts.rootUrl || ROOT_URL;
  this.authorized = false;

  this.requestHeaders = {
    'Authorization': 'Bearer ' + opts.accessToken
  }

  this.onUnauthorized = function() {
    return new Promise(function(resolve, reject) {
      // fn(this, resolve, reject)
      resolve(this)
    }.bind(this))
  }

  this.onForbidden = this.onUnauthorized;
}

Client.prototype.authorize = function() {
  var client = this;
  return new Promise(function(resolve, reject) {
    var link = { href: client.rootUrl };
    client.request(link, {}, function(data) {
      if (!data._class || ~data._class.indexOf('errors'))
        return reject(new Error(data.message))

      var target  = new Element(client, data);
      client.root = new Proxy(target, proxyHandler);
      resolve(client.root);
    }, reject);
  })
}

Client.prototype.request = function(link, params, onSuccess, onError) {
  var client = this;

  var start = Date.now();
  console.log((link.method || 'GET').blue, link.href.split('{')[0].grey)

  sendRequest(link.method, link.href, params, client.requestHeaders)
    .then(handleResponse)
    .catch(function(err) {
      // console.log(err);
      onError && onError(err);
    });

  function handleResponse(resp) {
    var code = resp.status,
        time = Date.now() - start;

    console.log(code.toString().cyan, link.href.split('{')[0].grey, time/1000)

    switch(code) {
      case 401:
        // if (client.authorized)
          return done(code, resp.json())

        // return client.onUnauthorized().then(function() {
        //   console.log('Unauthorized. Resending request...')
        //   client.request(link, params, onSuccess, onError);
        // })

      case 403:
        return client.onForbidden().then(function() {
          done(code, resp.json());
        }).catch(onError)

      default:
        client.authorized = true;
        return done(code, resp.json());
    }
  }

  function done(code, parser) {
    parser.then(function(data) {
      onSuccess(data);
    }).catch(onError)
  }
}

function sendRequest(method, url, params, headers) {

  var options = {
    method  : method || 'get',
    headers : headers
  }

  options.headers['Accept'] = 'application/json';
  options.headers['Content-Type'] = 'application/json';

  // temporary hack
  if (params.subdomain) {
    params.subdomains = params.subdomain;
    delete params.subdomain;
  }

  if (~url.indexOf('{')) { // templated
    var template = uriTemplate(url);
    url = template.fill(params);

    template.varNames.forEach(function(v) {
      delete params[v]
    })
  }

  if (Object.keys(params).length > 0)
    options.body = JSON.stringify(params)

  // console.log(url, options)
  return fetch(url, options);
}

module.exports = Client;
