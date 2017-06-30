var BooticAPI = require('./api');

var client = new BooticAPI({ 
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdXRoIjowLCJhcHAiOjkzLCJ1aWQiOjAsInNpZHMiOls0N10sImFpZCI6NDYsInNjb3BlcyI6WyJnb2QiXSwiaWF0IjoxNDk4Nzk3ODA0LCJleHAiOjE0OTg4MDE0MDQsInR0bCI6MzYwMCwianRpIjoiNWJkMSJ9.PV4yZbbatYvXoThGMdoGTPf_JUmZPv7hhLQVIS0JAYY5QITr6JrzeJVp91ZbJ1qUWHoJX0r4tTpkrQoO-h-N4FLKNL65i5e1BHWFc_GrWZWhj0eFdWEetHq-7GZGfT6Q9sxaE6Va9_TZswPRGlLe8YKeJtLbIC75nJaTnUJBYO4'
})

process.on('unhandledRejection', (reason, p) => {
   console.log('Unhandled Rejection at:', p, 'reason:', reason);
   // application specific logging, throwing an error, or other logic here
});

function searchOrders(root) {
  root.shops.where({ subdomain: 'oxygen' }).first(function(shop) {
    shop.orders.search({ status: 'foo' }).then(function(result) {
      // console.log('result', result)
      result.each(function(order, i) {
        console.log(i, order.total)
      })
    })
  })
}

function searchOrdersDirect(root) {
  root.shops.where({ subdomain: 'oxygen' }).first
      .orders.search({ status: 'checkout' }).then(function(result) {
        // console.log('result', result)
        result.each(function(order, i) {
          console.log(i, order.total, order.status)
        })
      })
}

client
  .authorize()
  .then(function(root) {

    // searchOrders(root);
    searchOrdersDirect(root);

/*
    root.shops.last(function(s) {
      console.log('Shop:', s.name)
    })

    root.shops.where({ subdomain: 'romano' }).first(function(shop) {
      console.log(shop.description)
    })

    root.shops.where({ subdomain: 'romano' }).first.orders.last(function(o) {
      console.log(o.total)
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