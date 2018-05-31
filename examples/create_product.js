var bootic   = require('../'),
    reply    = require('reply'),
    helpers  = require('./helpers'),
    args     = helpers.args();

if (!args.token && !args.clientId) {
  helpers.usage('create_products.js', '[order_status]');
}

const product_info = {
  model: {
    message: 'Nombre del producto (e.g. iPhone 12)'
  },
  price: {
    message: 'Precio'
  },
  product_type: {
    message: 'Tipo del producto (e.g. Celulares)'
  }
}

function getProductInfo(shop) {
  product_info.price.message += ' (en ' + shop.currency_code + ')';

  return new Promise(function(resolve, reject) {
    reply.get(product_info, function(err, answers) {
      if (err) return reject(err);
      resolve(answers);
    })
  })
}

function createProduct(shop, info) {
  console.log('Creating product in shop', shop.subdomain);
  return shop.create_product(info);
}

var current_shop;

bootic
  .auth(args)
  .then(function(root) {
    return helpers.getShop(root, args.shop || args.subdomain)
  })
  .then(function(shop) {
    current_shop = shop;
    return getProductInfo(shop);
  })
  .then(function(info) {
    return createProduct(current_shop, info);
  })
  .then(function(resp, status) {
    return console.log(status < 300 ? 'Great success!' : resp._embedded.errors);
  })
  .catch(function(err) {
    console.log('err!', err)
  })

/*

  BONUS! and a less promisy way of writing the above:

  bootic.auth(token).then(function(root) {
    root.shops.all(function(list) {
      var shop = helpers.selectShopFrom(list);
      reply.get(product_info, function(err, info) {
        if (!err) createProduct(shop, info);
      })
    })
  })

*/