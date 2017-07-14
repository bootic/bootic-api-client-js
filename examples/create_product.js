var bootic   = require('../api'),
    reply    = require('reply'),
    helpers  = require('./helpers'),
    token    = process.argv[2];

if (!token) {
  console.log('Usage: ./create_products.js [token]');
  process.exit(1);
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
  console.log('Creating product in shop', shop);
  return shop.create_product(info);
}

var current_shop;

bootic
  .authorize(token)
  .then(function(root) {
    return root.shops.all();
  })
  .then(function(list) {
    return helpers.selectShopFrom(list);
  })
  .then(function(shop) {
    current_shop = shop;
    return getProductInfo(shop);
  })
  .then(function(info) {
    return createProduct(current_shop, info);
  })
  .catch(function(err) {
    console.log('err!', err)
  })
