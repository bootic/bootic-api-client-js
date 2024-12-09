function isObject(obj) {
  return obj && obj.constructor.name == 'Object'
}

function isArray(obj) {
  return obj && obj.constructor.name == 'Array'
}

function isNumber(num) {
  return typeof num == 'number'
}

function isFunction(fn) {
  return typeof fn == 'function'
}

function containsVerb(word) {
  return !!word.replace('btc:', '').match(/^(get|update|create|remove|destroy)_/)
}

export {
  isObject,
  isArray,
  isNumber,
  isFunction,
  containsVerb,
}