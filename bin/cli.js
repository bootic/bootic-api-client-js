#!/bin/sh
':' //; exec "$(command -v nodejs || command -v node)" "$0" "$@"

var bootic  = require('..'),
    repl    = require('repl'),
    helpers = require('../examples/helpers'),
    args    = helpers.args();

if (!args.token && !args.clientId) {
  helpers.usage('cli.js');
}

function startRepl(root) {
  var replServer = repl.start({
    prompt: "bootic> ",
    useColors: true
  });

  replServer.context.r = root;
  replServer.context.current = root;
  require('./promise-repl').promirepl(replServer);
}

bootic.auth(args).then(function(root) {
  startRepl(root);
}).catch(function(err) {
  console.log(err.message);
})
