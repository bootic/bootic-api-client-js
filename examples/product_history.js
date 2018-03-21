var bootic   = require('../'),
    helpers  = require('./helpers'),
    args     = helpers.args();

if (!args.token && !args.clientId) {
  helpers.usage('product_history.js');
}

function listEvents(events) {
  events.forEach(function(ev) {
    console.log(ev.created_on, ev.app_name, ev.topic, ev.changes);
  })
}

process.on('unhandledRejection', function(reason, p) {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
})

var current_shop;

bootic
  .auth(args)
  .then(function(root) {
    return helpers.getShop(root, args.subdomain)
  })
  .then(function(shop) {
    current_shop = shop;
    return shop.products.where({ q: args._[0] }).first()
  })
  .then(function(product) {
    if (!product)
      throw new Error('Product not found: ' + args._[0])

    return current_shop.events.where({ item_type: 'product', item_id: product.id, sort: 'asc' }).all()
  })
  .then(function(events) {
    return listEvents(events)
  })
  .catch(function(err) {
    console.log('err!', err)
  })

