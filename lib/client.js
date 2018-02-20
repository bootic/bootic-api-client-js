const debug       = require('debug')('bootic'),
      colour      = require('colour'),
      Request     = require('./request'),
      Strategies  = require('./strategies'),
      Elements    = require('./elements')

const ROOT_URL    = 'https://api.bootic.net/v1'

function Client(strategy, opts) {
  var Strategy = Strategies[strategy]
  if (!Strategy)
    throw new Error('Invalid strategy, valid ones are: ' + Object.keys(Strategies))

  this.strategy = new Strategy(opts)
  this.rootUrl  = opts.rootUrl || ROOT_URL
}

Client.prototype.getToken = function() {
  var client = this
  return client.strategy.getToken(client.accessToken).then(function(token) {
    debug('Strategy returned token:', token)
    client.accessToken = token
  })
}

Client.prototype.authorize = function() {
  var client = this
  return client.getToken().then(function() {
    return client.request({ href: client.rootUrl }, {}).then(function(data) {
      // entry point detection
      if (!data._class || ~data._class.indexOf('errors'))
        throw new Error(data.message)

      client.root = Elements.root(client, data)
      return client.root
    })
  })
}

Client.prototype.request = function(link, params) {
  var client  = this,
      start   = Date.now(),
      headers = { 'Authorization': 'Bearer ' + client.accessToken }

  debug(link)
  console.log((link.method || 'GET').blue, link.href.split('{?')[0].grey)

  return Request.send(link.method, link.href, params, headers).then(function(resp) {
    var code = resp.status,
        time = Date.now() - start

    debug(code.toString().cyan, link.href.split('{?')[0].grey, time/1000)

    if (code == 401) {
      if (!client.strategy.canRefresh)
        throw new Error('Token expired.')

      console.log(('Refreshing token...'.green))
      return client.getToken().then(function() {
        return client.request(link, params)
      })
    } else if (code > 498) {
      throw new Error('Invalid response: ' + code);
    }

    return resp.json()
  })
}

module.exports = Client

module.exports.auth = function(strategy, opts) {
  if (typeof strategy == 'object') {
    opts = strategy
    strategy = opts.strategy || (opts.token && opts.clientId ? 'authorized' : opts.token ? 'bearer' : 'credentials')
  }
  return new Client(strategy, opts).authorize()
}
