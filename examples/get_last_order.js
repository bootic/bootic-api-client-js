var bootic   = require('../'),
    helpers  = require('./helpers'),
    args     = helpers.args();

if (!args.token && !args.clientId) {
  helpers.usage('get_last_order.js', '[order_status]');
}

function getLastOrderFrom(shop, st) {
  function show(order) {
    return order ? order.explain() : console.log('No orders found.');
  }

  if (st)
    shop.orders.where({ status: st }).last(show)
  else
    shop.orders.last(show)
}

bootic
  .auth(args)
  .then(function(root) {
    return root.shops.all();
  })
  .then(function(list) {
    return helpers.selectShopFrom(list);
  })
  .then(function(shop) {
    return getLastOrderFrom(shop, status);
  })
  .catch(function(err) {
    console.log('err!', err)
  })
