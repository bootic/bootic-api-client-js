var bootic   = require('../'),
    helpers  = require('./helpers'),
    colorize = helpers.colorize,
    //  inspect  = require('util').inspect,
    args     = helpers.args();

if (!args.token && !args.clientId) {
  helpers.usage('shop_info.js');
}

function print(str, color) {
  console.log(colorize(str, color))
}

function showInfo(shop) {
  console.log('Shop ID:', shop.id)
  console.log('Shop Name:', shop.name)
  console.log('Description:', shop.description)
  console.log('URL:', shop.description)
  console.log('Default Locale:', shop.locale)
  console.log('Default Currency:', shop.currency_code)
  console.log('Product Counts:', shop.product_counts)
  console.log('Embedded Data:', Object.keys(shop._embedded))
  // console.log('Resource Links:', Object.keys(shop._links))
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

    showInfo(shop)
  })
  .catch(function(err) {
    console.log('err!', err)
  })

