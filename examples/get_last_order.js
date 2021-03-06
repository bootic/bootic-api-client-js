var bootic   = require('../'),
    helpers  = require('./helpers'),
    args     = helpers.args();

var orderStatus = args._[0]; // optional

if (!args.token && !args.clientId) {
  helpers.usage('get_last_order.js', '[order_status]');
}

function getLastOrderFrom(shop, status) {
  function show(order) {
    return order ? order.explain() : console.log('No orders found.');
  }

  if (status)
    shop.orders.where({ status: status }).last(show)
  else
    shop.orders.last(show)
}

process.on('unhandledRejection', function(reason, p) {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
})

bootic
  .auth(args)
  .then(function(root) {
    return helpers.getShop(root, args.shop || args.subdomain)
  })
  .then(function(shop) {
    return getLastOrderFrom(shop, orderStatus);
  })
  .catch(function(err) {
    console.log('err!', err)
  })
