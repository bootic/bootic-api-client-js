var inquirer = require('inquirer');

exports.selectShopFrom = function(list) {
  if (list.length == 0)
    throw new Error('No shops found!');
  else if (list.length == 1)
    return new Promise(function(resolve, reject) { resolve(list[0]) })

  var subs = list.map(function(s) { return s.subdomain });

  return inquirer.prompt({
    name: 'subdomain',
    type: 'list',
    message: 'Elige una tienda',
    choices: subs
  }).then(function(answers) {
    var found = list.filter(function(shop) {
      return shop.subdomain == answers.subdomain;
    })

    if (found[0]) 
      return found[0];
    else 
      throw new Error('Invalid shop: ', answers.subdomain);
  });
}