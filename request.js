var uriTemplate = require('uri-templates');

if (typeof fetch == 'undefined') {
  var fetch = require('node-fetch-polyfill');
}

function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

function getLink(link, params, headers) {
  var href      = link.href || link;
  var template;
  var params    = params; // ? clone(params) : {};
  var templated = !!link['templated'];
  var method    = link['method'] || 'get';

  headers['Accept'] = 'application/json';
  headers['Content-Type'] = 'application/json';

  if (templated) {
    template = uriTemplate(href);
    href = template.fill(params);
  }

  var options = {
    method: method,
    headers: headers
  };

  if (method == 'post' || method == 'put' || method == 'patch') {
    if (template) {
      template.varNames.forEach(function (v) {
        delete params[v]
      })
    }
    options.body = JSON.stringify(params)
  }

  // console.log(' ----> fetching', href, options);
  return fetch(href, options);
}

module.exports = getLink;