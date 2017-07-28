const vm = require('vm')
var sandbox, result

const contextProxy = {
  get: function(target, name) {
    if (name in global)
      return global[name]
    else if (name in target)
      return target[name]
  }
}

module.exports = function(repl) {
  function sandboxEval(cmd, context, filename, cb) {
    sandbox = sandbox || vm.createContext(new Proxy(context, contextProxy))

    try {
      result = vm.runInContext(cmd, sandbox)
      cb(null, result)
    } catch(e) {
      cb(e)
    }
  }

  repl.eval = sandboxEval
}