var bootic   = require('../'),
    reply    = require('reply'),
    helpers  = require('./helpers'),
    args     = helpers.args();

if ((!args.token && !args.clientId) || args._.length == 0) {
  helpers.usage('upload_image.js', '[image1] [image2] .. [imageX]');
  process.exit(1);
}

function selectProduct(products) {
  return helpers.selectFrom(products, 'title', 'Select a product')
}

function uploadImages(shop, product, images) {
  console.log('Uploading ' + images.length + ' images to product', product.title);
  return shop.upload_images(product, images);
}

var current_shop;

bootic
  .auth(args)
  .then(function(root) {
    return helpers.getShop(root, args.shop || args.subdomain)
  })
  .then(function(shop) {
    current_shop = shop;
    return shop.products.all();
  })
  .then(function(products) {
    return selectProduct(products);
  })
  .then(function(product) {
    return uploadImages(current_shop, product, args._);
  })
  .catch(function(err) {
    console.log('err!', err)
  })
