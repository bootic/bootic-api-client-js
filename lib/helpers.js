var helpers = {};

helpers.isObject = function(obj) {
  return obj && obj.constructor.name == 'Object'
}

helpers.isArray = function(obj) {
  return obj && obj.constructor.name == 'Array'
}

helpers.isNumber = function(num) {
  return typeof num == 'number'
}

helpers.isFunction = function(fn) {
  return typeof fn == 'function'
}

helpers.containsVerb = function(word) {
  return !!word.replace('btc:', '').match(/^(get|update|create|remove|destroy)_/)
}

module.exports = helpers;