var inquirer = require('inquirer'),
    optimist = require('optimist');

exports.args = function() {
  return optimist.argv;
}

exports.usage = function(command, args) {
  var put = console.log;
  put('Usage: ' + command + ' [options] ' + (args || ''));
  put('Options:')
  put('   --strategy\t\tAuth strategy to use: `bearer`, `credentials`, or `authorized`. Optional.');
  put('   --token\t\tAccess token, if using `bearer` strategy.');
  put('   --clientId\t\tClient ID, for `credentials` authorization strategy.');
  put('   --clientSecret\tClient secret, also for `credentials` auth strategy.');
  put('   --rootUrl\t\tRoot API URL. Useful if testing against a local or staging server.');
  put('   --authHost\t\tHost to use for OAuth2 authorization (used in `credentials` or `authorized` strategies).');
  put('   --scope\t\tOAuth2 authorization scope. Optional.');
  put('')
  process.exit(1);
}

exports.selectFrom = function(list, attr, message) {
  var choices = list.map(function(el) { return el[attr]} );

  return inquirer.prompt({
    name: 'result',
    type: 'list',
    message: message,
    choices: choices
  }).then(function(answers) {
    var found = list.filter(function(el) {
      return el[attr] == answers.result;
    })

    if (found[0])
      return found[0];
    else
      throw new Error('Not found: ', answers.result);
  });
}

exports.selectShopFrom = function(list) {
  if (list.length == 0)
    throw new Error('No shops found!');
  else if (list.length == 1)
    return new Promise(function(resolve, reject) { resolve(list[0]) })

  return exports.selectFrom(list, 'subdomain', 'Elige una tienda');
}
