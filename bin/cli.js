#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

var bootic  = require('..'),
    repl    = require('./re-pl'),
    helpers = require('../examples/helpers'),
    colour  = require('colour'),
    args    = helpers.args()

var replHistory  = require('repl.history'),
    historyFile  = require('path').join(process.env.HOME, '.bootic_repl_history')

if (args.h || args.help) {
  helpers.usage('cli.js')
} else if (!args.token && !args.clientId) {
  helpers.getConfig(args, run)
} else {
  run()
}

function run() {
  bootic.auth(args).then(function(root) {
    global.r = global.bootic = root;
    var replStart = repl(function(code) { return eval(code) })
    replStart
    replStart()

    console.log(replStart.context)

  }).catch(function(err) {
    console.log('boom!', err.message.red)
    console.log(err.stack)
  })
}
