#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

var bootic  = require('..'),
    vm      = require('vm'),
    repl    = require('./re-pl'),
    helpers = require('../examples/helpers'),
    colour  = require('colour'),
    args    = helpers.args()

var replHistory  = require('repl.history'),
    historyFile  = require('path').join(process.env.HOME, '.bootic_repl_history')

if (args.h || args.help) {
  helpers.usage('cli.js')
} else if (!args.token && !args.clientId) {
  helpers.getConfig(args, function() { init(startRepl) })
} else {
  init(startRepl)
}

process.on('unhandledRejection', function(reason, p) {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
})

function init(cb) {
  var vars = {};

  function done() {
    cb(vars)
  }

  bootic.auth(args).then(function(root) {
    vars.root = root;

    if (!args.subdomain)
      return done()

    helpers.getShop(root, args.subdomain).then(function(shop) {
      if (!shop) console.warn('Shop not found: ' + args.subdomain)
      else vars.shop = shop;
      done()
    })

  }).catch(function(err) {
    console.log('boom!', err.message.red)
    console.log(err.stack)
  })
}

function completer(sandbox) {
  return function(line, cb) {
    return cb();
  }
}

function startRepl(vars) {
  var sandbox = vm.createContext(vars);
  console.log('Welcome! Available variables: ' + Object.keys(vars).join(', '))

  var replStart = repl(function(code) { return vm.runInContext(code, sandbox) })
  var server = replStart({
    prompt: 'bootic> ',
    useColors: true,
    completer: completer(sandbox)
  })

  replHistory(server, process.env['NODE_REPL_HISTORY'] || historyFile)
}
