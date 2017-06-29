/*
var paths = {};

paths.root = function (cb) {
  setTimeout(function() {
    cb(200, { _links: { 'products': 'second' }})
  }, 100);
}

paths.second = function(cb) {
  setTimeout(function() {
    cb(200, { items: [{ model: 'one'}, { model: 'two' }], _links: { 'third': 'xxx'} })
  }, 100);
}

function fetchURL(link, cb) {
  if (paths[link])
    paths[link](cb);
  else 
    cb({})
}

*/

var getLink = require('./request');

function runLink(client, link, params, cb) {
  var headers = client._authHandler({}, client._opts);

  var onUnauthorized = client._onUnauthorized,
      onForbidden = client._onForbidden,
      logger = client.logger,
      code;

  function done(code, parser) {
    parser.then(function(data) {
      cb(code, data);
    })
  }

  return getLink(link, params, headers).then(function(response) {
    code = response.status;
    if (code == 401) {
      if (!client.authSuccess) {
        console.log("401. Retrying...");
        return onUnauthorized(client).then(function() {
          return runLink(client, link, params, cb)
        })
      } else {
        done(code, response.json())
      }
    } else if(code == 403) {
      return onForbidden(client).then(function() {
        done(code, response.json());
      })
    } else {
      client.authSuccess = true;
      done(code, response.json());
    }
  }).catch(function(err) {
    console.log('err!', err);
  })
}

function getPath(client, path, params, cb) {
  var current, link, lastResponse, parts = path.split('.');

  function next() {
    current = parts.shift();

    if (!current)
      return cb(lastResponse)

    console.log('Fetching', current, lastResponse);
    link = lastResponse ? lastResponse._links['btc:' + current] : client._rootUrl;
    if (!link)
      throw new Error('Link not found: ' + current);

    console.log('Getting link:', link);
    runLink(client, link, params, function(code, resp) {
      if (!resp)
        throw new Error('Invalid response')

      lastResponse = resp;
      next();
    })
  }

  next()
}

/*
getPath('root.products', function(res) {
  console.log('Done!', res)
})
*/

let proxyHandler = {
  get: function(target, name) {
    if (target[name]) { // method exists
      return target[name].call(target);
    } else {
      target.addPath(name);
      return new Proxy(target, proxyHandler);
    }
  }
}

function Finder(client) {
  this._client = client;
  this._paths  = ['root'];
  this._cache  = {};
} 

Finder.prototype.addPath = function(path) {
  this._paths.push(path);
}

Finder.prototype.fetch = function(cb) {
  var self = this,
      path = this._paths.join('.');

  if (self._cache[path])
    return cb(self._cache[path]);

  getPath(self._client, path, {}, function(resp) {
    self._cache[path] = resp;
    self._path = ['root'];
    cb(resp);
  });
}

/*
Finder.prototype.map = function() {
  var paths = this._paths;
  var result = [{ model: 'one'}, { model: 'two' }];

  return function map(cb) {
    return result.map(cb)  
  }
}
*/

Finder.prototype.eachItem = function() {
  var self = this;

  return function eachItem(cb) {
    return self.fetch(function(result) {
      return result._embedded.items.forEach(cb)  
    })
  }
}

Finder.prototype.get = function() {
  var self = this;

  return function get(cb) {
    return self.fetch(cb);
  }
}


//////////////////////////////////////////////////////////////////////////
//

var ROOT_URL = 'https://api.bootic.net/v1';

var AccessTokenHandler = function (headers, opts) {
  if (opts.accessToken) {
    headers['Authorization'] = 'Bearer ' + opts.accessToken
  }
  return headers
}

var noop = function (client, next, reject) { reject("Unauthorized") }

var Client = function(opts) {
  opts = opts || {}
  this._opts        = opts
  this.logger       = opts.logger  || console;
  this._rootUrl     = opts.rootUrl || ROOT_URL;
  this._authHandler = AccessTokenHandler
  this._retryCount  = 0;
  this.onUnauthorized(noop)
  this.onForbidden(noop)

  var target = new Finder(this);
  this.root = new Proxy(target, proxyHandler);
};

Client.prototype = {
  authorize: function(token) {
    this._opts.accessToken = token
    return this
  },

  onUnauthorized: function (fn) {
    var self = this;
    this._onUnauthorized = function () {
      return new Promise(function(resolve, reject) {
        fn(self, resolve, reject)
      })
    }
    return this
  },

  onForbidden: function (fn) {
    var self = this;
    this._onForbidden = function () {
      return new Promise(function(resolve, reject) {
        fn(self, resolve, reject)
      })
    }
    return this
  }

/*
  run: function (link, params) {
    var headers = this._authHandler({}, this._opts);

    var onUnauthorized = this._onUnauthorized,
        onForbidden = this._onForbidden,
        self = this;

    self.logger.log("request", options.method, href);
    return getLink(link, headers, params).then(function(response) {

      if (response.status == 401) {
        if (self._retryCount == 0) {
          self._retryCount++
          self.logger.log("401. Retrying...")
          return onUnauthorized(self).then(function() {
            return self.run(link, params)
          })
        } else {
          return response.json()
        }
      } else if(response.status == 403) {
        return onForbidden(self).then(function() {
          return response.json()
        })
      } else {
        self._retryCount = 0
        return response.json()
      }
    })
  }
*/

}


//////////////////////////////////////////////////////////////////////////
//

/*
var names = bootic.root.products.map(function(prod) {
  return prod.model;
})

console.log('names', names);

bootic.root.products.each(function(prod) {
  console.log(prod.model);
  // return prod.model;
})

*/

var bootic = new Client({ accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdXRoIjowLCJhcHAiOjkzLCJ1aWQiOjAsInNpZHMiOls0N10sImFpZCI6NDYsInNjb3BlcyI6WyJnb2QiXSwiaWF0IjoxNDk2OTYzNjAxLCJleHAiOjE0OTY5NjcyMDEsInR0bCI6MzYwMCwianRpIjoiM2FjYyJ9.nyQZuBCkxdIoLKINl0cUMgt0HJnkvLZVf8XqWiRkhEs2WImB_g0QX1xVu7YdRzFNitQH3okicMgdAnJ8RyCAyjyG1scrrL8NrjEXMzBO2U1lDsci67G2cn99T_LrVhZj6UtDndXLjkPfzrFr-U4XTtM2tvJ44LbEgNOZ_T5bfPg' })

/*
bootic.root.get(function(root) {
  console.log('Root', root)
})
*/


bootic.root.all_shops.eachItem(function(shop) {
  console.log(shop.subdomain);
})

/*
bootic.root.shops.eachItem(function(shop) {
  console.log('Shop', shop)
})
*/

bootic.shops.with(subdomain: 'foo').first(function(err, data) {

})

bootic.shops.all.each(function(err, shop) {

})


bootic.shops.with(subdomain: 'foo').each(function(err, data) {

})



bootic.shops.with(subdomain: 'foo').last(function(err, data) {

})

// link traversal using proxies
bootic.shops.first(function(err, shop) {
  // getting an attribute of an item
  console.log(shop.subdomain)

  // working over a list of embedded items
  shop.addons.forEach(function() {

  })
})

root.shops.forEach(function() {

})

root.shops.where(subdomain: 'asd').first(function(err, list) {

})

root.subscription.get(function(err, sub) {

})

# Collection

## [Collection].where(query)

--> Requests a link with params. Returns Collection. Example:

    root.shops.where(subdomain: 'foo')...

## [Collection].forEach(cb)

 --> Iterates over each of a collection's items. 

## [Collection].each(cb) 