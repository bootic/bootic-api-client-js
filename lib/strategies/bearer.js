function BearerStrategy(opts) {
  if (!opts.accessToken && !opts.token)
    throw new Error('accessToken required!')

  var token = opts.accessToken || opts.token

  function getToken() {
    return new Promise(function(resolve, reject) {
      resolve(token)
    })
  }

  return { getToken: getToken, canRefresh: false }
}

module.exports = BearerStrategy