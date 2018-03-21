var debug       = require('debug')('bootic');
var uriTemplate = require('uri-templates');

if (typeof fetch == 'undefined') {
  var fetch = require('node-fetch-polyfill');
  require('http').globalAgent.keepAlive = true;
}

function sendRequest(method, url, params, headers) {
  var template, params = params || {}, options = {
    // redirect: options.redirect || 'manual',
    // keepalive: true,
    method  : (method || 'get').toUpperCase(),
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
    // detect required params, the ones not starting with {? or {&
    var missingParams = (url.match(/{(?!\?|&)([^}]+)}/g) || []).filter(function(v) {
      var name = v.split(/{|}/)[1];
      return !params[name];
    })

    if (missingParams.length)
      throw new Error('Missing variables for query: ' + missingParams.join(', '));

    template = uriTemplate(url);
    url = template.fill(params);

    template.varNames.forEach(function(v) {
      delete params[v];
    })
  }

  if (Object.keys(params).length > 0) {
    if (template)
      throw new Error('Invalid params: ' + Object.keys(params));

    if (['get', 'head'].indexOf(options.method) != -1)
      throw new Error('GET or HEAD request, cannot send these params: ' + Object.keys(params));

    options.body = JSON.stringify(params);
  }

  debug(url, JSON.stringify(options).yellow);
  return fetch(url, options);
}

function streamData(url, headers, cb, done) {
  console.log(headers);

  return fetch(url, { headers: headers }).then(function(response) {
    var obj, reader = response.body.getReader();

    if (response.status > 300)
      throw new Error('Invalid response code: ' + response.status)

    function decode(str) {
      var data;
      try { data = JSON.parse(str.toString()) } catch(e) { }
      return data;
    }

    function next() {
      return reader.read().then(function(result) {
        obj = decode(result.value);
        if (obj) cb(obj)

        if (result.done) throw Error("Looks like we're done.");
        return next();
      })
    }

    return next();

  }).then(function(result) {
    done(null, result)

  }).catch(function(err) {
    done(err)
  });
}

exports.send = sendRequest;
exports.stream = streamData;