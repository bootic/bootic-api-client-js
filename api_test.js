var BooticAPI = require('./api');

// var token = process.argv[2];
// if (!token) { console.log('Token required'); process.exit(1) };

var client = new BooticAPI({ 
//  accessToken: token
  accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdXRoIjowLCJhcHAiOjkzLCJ1aWQiOjAsInNpZHMiOls0N10sImFpZCI6NDYsInNjb3BlcyI6WyJnb2QiXSwiaWF0IjoxNDk5OTkzNjcwLCJleHAiOjE0OTk5OTcyNzAsInR0bCI6MzYwMCwianRpIjoiYjNmZiJ9.YDy3Jzcnw6fCSrOatbIUFgfUSgtU1cD0Wjmxoa7rcvYJocc57-C5XYMvNAwTRhmh9M9Sv2LKo4JT4nhZQIPXCqCqxpCQB02rODFcPJ2SrLHpzd-StroBWBEzxmwPGlbzkQ6FHmVzyd27sTHNWG80DbIbP4f4_UT8A09jXQhDHko'
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

function getOrdersDirect(root) {
  root.shops.where({ subdomain: 'oxygen' }).first
    .orders.where({ status: 'checkout' }).last(function(order) {
      console.log(order.total, order.status)
      // result.each(function(order, i) {
      //   console.log(i, order.total, order.status)
      // })
    })
}


function getOrdersFromShop(root) {
  root.shops.where({ subdomain: 'romano' }).first(function(shop) {
    shop.explain()
    shop.orders.where({ status: 'pending' }).last(function(o) {
      console.log(o.status, o.total)
    })
  })
}

client
  .authorize()
  .then(function(root) {

    // searchOrders(root);
    getOrdersDirect(root);
    // getOrdersFromShop(root)

//     root.shops.first(function(shop) {
//       shop.inspect()
//     })

/*
    root.shops.where({ subdomain: 'romano' }).first(function(shop) {
      shop.products.where({ tags: 'Cartera' }).sort('price.asc').all(function(res) {
        console.log(res)          
      })
    })
*/



/*
    root.products.where({ shop_subdomains: 'romano', tags: 'Cartera' }).all(function(set) {
      console.log(set)
    })
*/


/*
    root.shops.first.theme.get(function(theme) {
      theme.templates.each(function(t) {
        console.log(t)
      })
    })
*/


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