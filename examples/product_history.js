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

function printRow(ev) {
  var topic = ev.topic == 'products.updated' ? ev.topic : ev.topic.replace('products.updated.', '');
  var row = [ev.created_on, topic, ev.scope_id, ev.type, ev.app_name, ev.user_name, ev.info].join(' | ');
  print(new Array(row.length + 3).join('-'), 'cyan')
  print(' ' + row + ' ', 'cyan');
  print(new Array(row.length + 3).join('-'), 'cyan')
}

function showChanges(obj) {
  if (showOnly)
    return print('Changes: ' + showOnly + ' -> ' + inspect(obj[showOnly]) + '\n', 'bold')

  // delete obj.updated_at;
  // delete obj.updated_on;
  print('Changes: ' + inspect(obj) + '\n', 'bold');
}

function listEvents(events) {
  events.reverse().filter(function(ev) {
    return !variantId || String(ev.scope_id) == String(variantId);
  }).forEach(function(ev) {
    if (!showOnly || ev.changes[showOnly]) {
      printRow(ev);

      if (Object.keys(ev.payload).length)
        print('Payload: ' + inspect(ev.payload) + '\n', 'purple');

      showChanges(ev.changes);
    }
  })
}

process.on('unhandledRejection', function(reason, p) {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
})

var current_shop;

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
      throw new Error('Product not found: ' + productId)

    var query = { item_type: 'product', item_id: product.id, sort: 'desc' };
    if (variantId) query.scope_id = variantId;
    return current_shop.events.where(query).limit(1000).all()
  })

  .then(function(events) {
    return listEvents(events)
  })
  .catch(function(err) {
    console.log('err!', err)
  })

