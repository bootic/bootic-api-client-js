var bootic   = require('../'),
    helpers  = require('./helpers'),
    args     = helpers.args();

var count = args._[0] || 20;
var order_status =  = args._[1] || 'closed,shipped,delivered';

if (!args.token && !args.clientId) {
  helpers.usage('order_addresses.js', '[num_orders] [order_status]');
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
    return helpers.getShop(root, (args.shop || args.subdomain))
  })
  .then(function(shop) {
    return shop.orders
      .where({ status: order_status })
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

