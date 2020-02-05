var bootic   = require('../'),
    helpers  = require('./helpers'),
    colorize = helpers.colorize,
    //  inspect  = require('util').inspect,
    args     = helpers.args();

var productId = args._[0];
var variantId = args._[1]; // optional
var showOnly  = args.filter; // optional

if ((!args.token && !args.clientId) || !productId) {
  helpers.usage('product_history.js', '[productId] [variantId]');
}

function print(str, color) {
  console.log(colorize(str, color))
}

function inspect(obj) {
  return JSON.stringify(obj, null, 2);
}

function wrapLine(str) {
  print(new Array(str.length + 3).join('-'), 'cyan')
  print(str, 'cyan');
  print(new Array(str.length + 3).join('-'), 'cyan')
}

function printHeader(ev, from, to) {
  var row = ['fecha'.padEnd(19), 'variante', 'de ', 'a  ', 'origen cambio'];
  wrapLine(' ' + row.join(' | ') + ' ');
}

function printRow(ev, from, to) {
  var row = [
    ev.created_on,
    String(ev.scope_id).padEnd(8),
    String(from).padEnd(3),
    String(to).padEnd(3)
  ];

  var last = ev.user_name ? ev.user_name + ' desde ' + ev.app_name : ev.app_name;
  if (ev.info) last += ', ' + ev.info;
  row.push(last);

  print(row.join(' | '));
}

function showChanges(obj) {
  if (showOnly)
    return print('Changes: ' + showOnly + ' -> ' + inspect(obj[showOnly]) + '\n', 'bold')

  // delete obj.updated_at;
  // delete obj.updated_on;
  print('Changes: ' + inspect(obj) + '\n', 'bold');
}

function listEvents(events) {
  printHeader();

  events.reverse().filter(function(ev) {
    return !variantId || String(ev.scope_id) == String(variantId);
  }).forEach(function(ev) {
    if (ev.changes.stock) {
      printRow(ev, ev.changes.stock[0], ev.changes.stock[1]);
    }
  })
}

process.on('unhandledRejection', function(reason, p) {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
})

var current_shop, current_product;

bootic
  .auth(args)
  .then(function(root) {
    return helpers.getShop(root, (args.shop || args.subdomain))
  })
  .then(function(shop) {
    if (!shop)
      throw new Error('Shop not found: ' + (args.shop || args.subdomain))

    current_shop = shop;
    return shop.products.find(productId);
  })
  .then(function(product) {
    if (!product)
      throw new Error('Product not found: ' + productId);

    current_product = product;
    var query = { item_type: 'product', item_id: product.id, sort: 'desc' };
    if (variantId) query.scope_id = variantId;
    return current_shop.events.where(query).limit(1000).all()
  })

  .then(function(events) {
    console.log('Producto: ' + current_product.title + ', ID: ' + current_product.id);
    return listEvents(events)
  })
  .catch(function(err) {
    console.log('err!', err)
  })

