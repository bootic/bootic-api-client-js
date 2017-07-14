var bootic   = require('../api'),
    reply    = require('reply'),
    helpers  = require('./helpers'),
    token    = process.argv[2];

if (!token || !process.argv[3]) {
  console.log('Usage: ./upload_image.js [image1] [image2] .. [imageX]');
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
  .authorize(token)
  .then(function(root) {
    return root.shops.all();
  })
  .then(function(list) {
    return helpers.selectShopFrom(list);
  })
  .then(function(shop) {
    current_shop = shop;
    return shop.products.all();
  })
  .then(function(products) {
    return selectProduct(products);
  })
  .then(function(product) {
    return uploadImages(current_shop, product, process.argv.slice(2));
  })
  .catch(function(err) {
    console.log('err!', err)
  })
