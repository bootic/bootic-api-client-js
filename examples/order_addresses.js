var bootic   = require('../'),
    helpers  = require('./helpers'),
    args     = helpers.args();

var count = args._[0] || 20;

if (!args.token && !args.clientId) {
  helpers.usage('order_addresses.js', '[num_orders]');
}

function listAddresses(addresses) {
  addresses.forEach(function(a) {
    var street = a.street + a.street_2;
    console.log(street + ', ' + a.locality_name + ', ' + a.region_name);
  })
}

process.on('unhandledRejection', function(reason, p) {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
})

bootic
  .auth(args)
  .then(function(root) {
    return root.shops.where({ subdomain: 'romano' }).all();
  })
  .then(function(list) {
    return helpers.selectShopFrom(list);
  })
  .then(function(shop) {
    return shop.orders
      .where({ status: 'closed,shipped,delivered' })
      .limit(count)
      .desc() // get last x
      .all()
  })
  .then(function(orders) {
    console.log('Got ' + orders.length + ' orders.');

    var addresses = orders.map(function(o) {
      return o.address
    }).filter(function(a) { return !!a }); // local pickup orders don't have addresses

    console.log('Got ' + addresses.length + ' addresses.');
    return listAddresses(addresses);
  })
  .catch(function(err) {
    console.log('err!', err)
  })

