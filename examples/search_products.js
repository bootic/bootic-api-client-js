var bootic   = require('../'),
    helpers  = require('./helpers'),
    colorize = helpers.colorize,
    //  inspect  = require('util').inspect,
    args     = helpers.args();

var query = args._[0];

if ((!args.token && !args.clientId) || !query) {
  helpers.usage('search_products.js', '[query]');
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
    return shop.products.where({ q: query });
  })
  .then(function(results) {
    console.log('Searching for products with: "' + query + '"')

    var rows = [];
    results.each(function(product) {
      rows.push(product);
    }, function() {
      console.log('Got ' + rows.length + ' results.');

      rows.forEach(function(product) {
        // var row = ['id'.padEnd(6), 'nombre', 'precio', 'stock'];
        // print(row.join(' | '));
        var row = ['producto:', product.id, product.title, product.price, product.stock];
        wrapLine(' ' + row.join(' | ') + ' ');

        product.variants.forEach(function(variant) {
          var row = [' variante:', variant.id, variant.title, variant.price, variant.stock];
          print(row.join(' | '))
        })
      })
    })
  })
  .catch(function(err) {
    console.log('err!', err)
  })

