const debug    = require('debug')('bootic');
const colour   = require('colour');

const Request  = require('./request');
const Elements = require('./elements');
const ROOT_URL = 'https://api.bootic.net/v1';

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

      client.root = Elements.root(client, data);
      resolve(client.root);
    }, reject);
  })
}

Client.prototype.request = function(link, params, onSuccess, onError) {
  var client = this;

  var start = Date.now();
  debug(link);
  console.log((link.method || 'GET').blue, link.href.split('{')[0].grey)

  Request.send(link.method, link.href, params, client.requestHeaders)
    .then(handleResponse)
    .catch(function(err) {
      // print(err);
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
        //   print('Unauthorized. Resending request...')
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

module.exports = Client;

module.exports.authorize = function(token) {
  return new Client({ accessToken: token }).authorize(token);
}
