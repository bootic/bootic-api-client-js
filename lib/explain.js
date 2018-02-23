const colour = require('colour')
const containsVerb = require('./helpers').containsVerb
const LINK_PREFIX = 'btc:'

function explain(el) {
  function showProperties(obj) {
    if (!obj) return;
    var list = Object.keys(obj).filter(function(k) { return k[0] != '_' })
                               .map(function(k) { return '  ' + k.cyan + ': ' + obj[k] })
    console.log(list.join('\n'));
  }

  function showLinks(obj) {
    if (!obj) return;

    var desc, list = Object.keys(obj).map(function(k) {
      desc = (containsVerb(k) || (obj[k].method || 'get') != 'get') ? 'Action' : (k[k.length-1] == 's' ? 'Collection' : 'Element')
      return '  ' + k.replace(LINK_PREFIX, '').cyan + ' (' + desc + '): ' + (obj[k].title || 'No description');
    });

    console.log(('\n -- Elements/Collection Links:').bold)
    console.log(list.filter(function(str) { return !str.match('(Action)')} ).join('\n'))
    console.log(('\n -- Action Links:').bold)
    console.log(list.filter(function(str) { return str.match('(Action)')} ).join('\n'))
  }

  function showEmbedded(obj) {
    if (!obj) return;
    var desc, list = Object.keys(obj).map(function(k) {
      desc = Array.isArray(obj[k]) ? 'Collection' : 'Element';
      return '  ' + k.cyan + ': ' + desc
    });
    console.log(list.join('\n'));
  }

  return function explain(opts) {
    if (opts)
      return console.log(JSON.stringify(el._data, null, 2));

    var type = el._data ? (el._data._class || [])[0] : null;
    console.log(('\n ' + (type || el.constructor.name)).blue)
    console.log(('\n -- Properties').bold); showProperties(el._data);
    console.log(('\n -- Embedded').bold); showEmbedded(el._embedded);
    showLinks(el._links);
    console.log()
  }
}

module.exports = explain