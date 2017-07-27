const debug       = require('debug')('bootic'),
      colour      = require('colour');

const Request     = require('./request'),
      Strategies  = require('./strategies'),
      Elements    = require('./elements');

const ROOT_URL    = 'https://api.bootic.net/v1';

function Client(strategy, opts) {
  var Strategy = Strategies[strategy];
  if (!Strategy)
    throw new Error('Invalid strategy, valid ones are: ' + Object.keys(Strategies))

  this.strategy   = new Strategy(opts);
  this.rootUrl    = opts.rootUrl || ROOT_URL;
  this.authorized = false;
}

Client.prototype.getToken = function() {
  var client = this;
  return client.strategy.getToken().then(function(token) {
    debug('Strategy returned token:', token);
    client.accessToken = token;
  });
}

Client.prototype.authorize = function() {
  var client = this;
  return new Promise(function(resolve, reject) {
    client.getToken().then(function() {
      client.request({ href: client.rootUrl }, {}, function(data) {

        // entry point detection
        if (!data._class || ~data._class.indexOf('errors'))
          return reject(new Error(data.message))

        client.root = Elements.root(client, data);
        resolve(client.root);
      })
    })
  })
}

Client.prototype.request = function(link, params, onSuccess, onError) {
  var client  = this,
      start   = Date.now(),
      headers = { 'Authorization': 'Bearer ' + client.accessToken };

  debug(link);
  console.log((link.method || 'GET').blue, link.href.split('{')[0].grey)

  Request.send(link.method, link.href, params, headers)
    .then(handleResponse)
    .catch(function(err) {
      onError && onError(err);
    });

  function handleResponse(resp) {
    var code = resp.status,
        time = Date.now() - start;

    console.log(code.toString().cyan, link.href.split('{')[0].grey, time/1000)

    switch(code) {
      case 401:
        if (!client.authorized) // invalid credentials
          return done(code, resp.json())

        console.log('Unauthorized. Resending request...')
        return client.getToken().then(function() {
          client.request(link, params, onSuccess, onError);
        }).catch(function(err) {
          client.authorized = false;
          onError && onError(err);
        })

      default:
        client.authorized = true;
        return done(code, resp.json());
    }
  }

  function done(code, parser) {
    parser.then(function(data) {
      onSuccess(data, code);
    }).catch(onError)
  }
}

module.exports = Client;

module.exports.auth = function(strategy, opts) {
  if (typeof strategy == 'object') {
    opts = strategy;
    strategy = opts.token ? 'bearer' : 'credentials'
  }
  return new Client(strategy, opts).authorize();
}
