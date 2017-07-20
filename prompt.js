var repl     = require('repl'),
    readline = require('readline'),
    Bootic   = require('.');

function abort(message) {
  console.warn(message);
  process.exit(1)
}

function getAccessToken(cb) {
  if (process.env.TOKEN)
    return cb(process.env.TOKEN);

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
    useColors: true
  });

  replServer.context.root = root;
}

getAccessToken(function(token) {
  Bootic.authorize(token).then(function(root) {
    startRepl(root);
  }).catch(function(err) {
    abort(err.message);
  })
})

