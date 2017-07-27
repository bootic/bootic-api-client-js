var ClientOAuth2 = require('client-oauth2')

function AuthorizedStrategy(opts) {
  if (!opts.clientId || !opts.clientSecret || (!opts.token && !opts.accessToken))
    throw new Error('token, clientId and clientSecret required!')

  var firstToken = opts.token || opts.accessToken

  var host = opts.authHost || 'https://auth.bootic.net'
  var auth = new ClientOAuth2({
    clientId         : opts.clientId,
    clientSecret     : opts.clientSecret,
    accessTokenUri   : host + '/oauth/token',
    // authorizationUri : host + '/oauth/authorize',
    scopes           : opts.scopes || ['admin'],
  })

  function getToken(currentToken) {
    var token = currentToken || firstToken;
    return auth.jwt.getToken(token).then(function(result) {
      return result.accessToken
    })
  }

  return {
    getToken: getToken
  }

}

module.exports = AuthorizedStrategy