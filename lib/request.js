var debug       = require('debug')('bootic');
var uriTemplate = require('uri-templates');

if (typeof fetch == 'undefined') {
  var fetch = require('node-fetch-polyfill');
  require('http').globalAgent.keepAlive = true;
}

function sendRequest(method, url, params, headers) {
  var template, options = {
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
    template = uriTemplate(url);
    url = template.fill(params);

    template.varNames.forEach(function(v) {
      delete params[v];
    })
  }

  if (Object.keys(params).length > 0) {
    if (template)
      throw new Error('Invalid params: ' + Object.keys(params));

    options.body = JSON.stringify(params);
  }

  debug(url, JSON.stringify(options).yellow);
  return fetch(url, options);
}

exports.send = sendRequest;