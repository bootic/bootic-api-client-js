var inquirer = require('inquirer'),
    optimist = require('optimist'),
    reply    = require('reply');

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

exports.getConfig = function(args, cb) {
  reply.get({
    token: {
      allow_empty: true
    },
    clientId: {
      allow_empty: true,
      depends_on: {
        token: undefined
      }
    },
    clientSecret: {
      allow_empty: true,
      depends_on: {
        token: undefined
      }
    },
    authHost: {
      default: args.authHost || 'https://auth.bootic.net'
    },
    rootUrl: {
      default: args.rootUrl || 'https://api.bootic.net/v1'
    }
  }, function(err, res) {
    for (var key in res)
      if (res[key]) args[key] = res[key];

    cb()
  })
}

exports.selectFrom = function(list, attr, message) {
  var choices = list.map(function(el) { return el[attr] });

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

exports.getShop = function(root, subdomain) {
  if (subdomain)
    return root.shops.where({ subdomain: subdomain }).first();

  return root.shops.all().then(function(list) {
    return exports.selectShopFrom(list);
  })
}

var colors = {
  light_cyan:   '1;36', // debug
  white:        '1;37', // info
  yellow:       '1;33', // notice
  yellow_two:   '1;33', // warn
  light_red:    '1;31', // error
  light_purple: '1;35', // critical
  light_gray:   '37',
  gray:         '90',
  black:        '30',
  dark_gray:    '1;30',
  red:          '31',
  green:        '32',
  light_green:  '1;32',
  brown:        '33',
  blue:         '34',
  purple:       '35',
  cyan:         '36',
  bold:         '1'
};

exports.colorize = function(str, color) {
  if (!str || str == '') return '';
  return color ? ['\033[', colors[color], 'm', str, '\033[0m'].join('') : str;
};
