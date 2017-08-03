#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

var bootic  = require('..'),
    repl    = require('repl'),
    helpers = require('../examples/helpers'),
    args    = helpers.args()

var replSandbox  = require('./repl-sandbox'),
    replPromises = require('./repl-promises'),
    replHistory  = require('repl.history'),
    historyFile  = require('path').join(process.env.HOME, '.bootic_repl_history')

if (!args.token && !args.clientId) {
  helpers.usage('cli.js')
}

function startRepl(root) {
  var replServer = repl.start({
    prompt: "bootic> ",
    useColors: true
  })

  replServer.context.r = root
  replServer.context.c = root

  replHistory(replServer, process.env['NODE_REPL_HISTORY'] || historyFile)
  replSandbox(replServer)
  replPromises(replServer)
}

bootic.auth(args).then(function(root) {
  startRepl(root)
}).catch(function(err) {
  console.log('err!', err.message)
  console.log(err.stack)
})
