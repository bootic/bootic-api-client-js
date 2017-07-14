var inquirer = require('inquirer');

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

  var subs = list.map(function(s) { return s.subdomain });
  return exports.selectFrom(list, 'subdomain', 'Elige una tienda');
}