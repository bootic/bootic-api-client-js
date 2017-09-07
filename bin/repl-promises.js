// Original version by David M. Lee, II
// From promirepl module

'use strict'

module.exports = function(repl) {
  var realEval = repl.eval

  function emptyResult(val) {
    return val === null || val === undefined;
  }

  function promiseEval(cmd, context, filename, cb) {
    realEval.call(repl, cmd, context, filename, function(err, res) {
      if (err)
        return cb(err)

      if (!res || typeof res.then != 'function') // Non-thenable response
        return cb(null, res)

      res.then(function(val) {
        if (emptyResult(val) || (!val.hasOwnProperty('message') || val.message != 'Access denied')) {
          repl.context.l = repl.context.c; // set current as last
          repl.context.c = val;            // and set new value as current
        }

        cb(null, val)
        // cb()

      }, function(err) {
        repl.outputStream.write('Promise rejected: ')
        cb(err)

      }).then(null, function(uncaught) {
        process.nextTick(function() {
          throw uncaught // Rethrow uncaught exceptions
        })
      })
    })
  }

  repl.eval = promiseEval

  repl.defineCommand('.promise', {
    help: 'Toggle auto-promise unwrapping',
    action: function () {
      if (repl.eval === promiseEval) {
        this.outputStream.write('Promise auto-eval disabled\n')
        repl.eval = realEval
      } else {
        this.outputStream.write('Promise auto-eval enabled\n')
        repl.eval = promiseEval
      }
      this.displayPrompt()
    }
  })
}