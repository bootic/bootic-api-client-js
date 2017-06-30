var BooticAPI = require('./api');

var client = new BooticAPI({ 
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdXRoIjowLCJhcHAiOjkzLCJ1aWQiOjAsInNpZHMiOls0N10sImFpZCI6NDYsInNjb3BlcyI6WyJnb2QiXSwiaWF0IjoxNDk4NzkzNTc4LCJleHAiOjE0OTg3OTcxNzgsInR0bCI6MzYwMCwianRpIjoiM2QzZSJ9.eScqX522dt8bn0b8REOxrrPRCAvSOG8d_za9sdWc_oLAvA1fFuW0KB47mkrXbQHwuB_XylZpxs1_w0jwKw0cxgPt3r3ukZSmBLPh-J5jAyj1EbD5hqWxf-gKpOa-eUuA2-G0LtQwak98G50srM-0RTEwq5BJNfUVAfwV76Rr-LY'
})

client
  .authorize()
  .then(function(root) {

    root.shops.first.orders.last(function(o) {
      console.log(o)
    })

/*
    root.shops.where({ subdomain: 'www' }).first(function(shop) {

      shop.orders.where({ code: '12345' }).each(function(o) {
        console.log('order', o);
      })

      shop.orders.search({ code: '12345' }).then(function(result) {
        result.each(function(res) {
          console.log('xx!!')
        })
      }).catch(function(err) {
        console.log(err)
      })
    })
*/
  })
  .catch(function(err) {
    console.log('!err', err)
  })

/*


// module.exports = Client;
var c = new Client();
var bootic = c.root;

// bootic is the root element. shops is an embedded collection
bootic.shops.where({ subdomain: 'www' }).first(function(shop) {
  console.log(' ---> Processing shop: ' + shop.subdomain);

  // linked element
  shop.theme.get(function(theme) { 
    console.log('theme', theme)
  })

  // linked collection, find by id. returns promise as it might fail
  bootic.shops.find('1234').then(function(shop) {
    // ...
  }).catch(function(err) { 
    // console.log(err) 
  })

  // linked collection
  shop.orders.find('abc123').then(function(o) { 
    // ... 
  }).catch(function(err) { 
    // console.log(err) 
  })

  shop
    .create_product({ name: 'Some product' })
    .then(function(result) { })
    .catch(function(err) { })

  // a linked action
  shop.create_order({ foo: 'bar' }).then(function(result) {
    console.log(result);
  })

  // a linked collection. same API as embedded collections
  shop.products.first(function(product) {
    // product.make_visible().then(function(result) { })
  })

  // collections respond to .each, .map, .first, .last, and .where
  shop.products.each(function(p) { console.log(p.price) })

  // a linked collection (products), filtered and sorted
  shop
    .products
    .where({ price_lte: 30000 })
    .sort('price.desc')
    .last(function(product) {
      // ...
    })
})

*/