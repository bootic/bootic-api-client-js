var ClientOAuth2 = require('client-oauth2')

function CredentialsStrategy(opts) {
  if (!opts.clientId || !opts.clientSecret)
    throw new Error('clientId and clientSecret required!')

  var host = opts.authHost || 'https://auth.bootic.net'
  var auth = new ClientOAuth2({
    clientId       : opts.clientId,
    clientSecret   : opts.clientSecret,
    accessTokenUri : host + '/oauth/token',
    scopes         : opts.scopes || ['admin'],
  })

  function getToken() {
    return auth.credentials.getToken().then(function(result) {
      return result.accessToken
    })
  }

  return { getToken: getToken, canRefresh: true }
}

module.exports = CredentialsStrategy