var repl      = require('repl'),
    readline  = require('readline'),
    BooticAPI = require('./api');

function abort(message) {
  console.warn(message);
  process.exit(1)
}

function getAccessToken(cb) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Access token: ', function(answer) {
    rl.close();
    cb(answer);
  });
}

function startRepl(root) {
  var replServer = repl.start({
    prompt: "bootic> ",
  });

  replServer.context.root = root;
}

getAccessToken(function(token) {
  var client = new BooticAPI({ accessToken: token });
  client.authorize().then(function(root) {
    startRepl(root)
  }).catch(function(err) {
    abort(err.message);
  })
})

