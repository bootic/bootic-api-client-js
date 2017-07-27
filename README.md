# Bootic JS API Client

Client for the [Bootic API](developers.bootic.net), written in pure Javascript, like real men do.

# Usage

``` js
const bootic = require('bootic')

bootic
  .auth('bearer', { accessToken: 'aabbcc...xxyyzz' })
  .then(function(root) {
    return root.shops.first();
  })
  .then(function(shop) {
    return shop.orders.last()
  })
  .then(function(order) {
    console.log(order)
  })
```

Or for a more advanced example, let's say we want to hide all products contained in the 'Offers' collection.

``` js
bootic
  .auth(options)
  .then(function(root) {
     // both callback and promises are allowed.
    root.shops.first(function(shop) {
      console.log(`Processing ${shop.subdomain}`); // Entity attribute

      // follow `products` link, that returns a collection and iterate over items
      shop.products.where(collection: 'Offers').forEach(function(product) {

        // and call the `update` action
        product.update(status: 'hidden').then(function(res) {
          console.log(res)
        })
      })
    })
```

# API

`.auth(strategy, opts)`

Initializes the client with the given options and strategy provided. `strategy` can be either `bearer`, `credentials` or `authorized`, or even skipped, in which case the strategy is deduced from the given credentials.

Options:

 - `accessToken`: Required for `bearer` and `authorized` strategies.
 - `clientId`: For `credentials` and `authorized` strategies.
 - `clientSecret`: Same as above.
 - `rootUrl`: To use an alternate endpoint for the API root.
 - `strategy`: Yes, you can also pass it as an option.

# Install

    npm install -g bootic (or yarn add)

# Using the client

## Collection

### [Collection].where(query)

--> Requests a link with params. Returns Collection. 

    root.shops.where(subdomain: 'foo')...

### [Collection].all(cb)

--> Returns a whole collection of items. 

    root.shops.all(function(shops) {
      console.log(shops) // [Collection]
    })

### [Collection].first(cb) 

--> Returns the first item of a collection.

### [Collection].last(cb) 

--> Returns the last item of a collection.

### [Collection].forEach(cb)

--> Iterates over each of a collection's items. 

    root.shops.forEach(function(shop) {
      console.log(shop) // [Entity]
    })

### [Collection].map(cb)

--> Maps over each collection's element, creating a new array with the returned values. 

    var names = root.shops.map(function(shop) {
      return shop.name;
    })

## Element
-----------------------------

### [Element].get

--> Retrieves an element's attributes and related links and embedded items.

    root.account.get(function(account) {
      console.log(account); // 
    })


## Examples
-----------------------------

List products in shop:

Download all images for my products:



Hide products in collection 'Offers':

