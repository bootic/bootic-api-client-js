# Bootic JS API Client

Pure Javascript, modern client for the [Bootic API](https://api.bootic.net), for Node.js and the browser.

Currently in beta.

# Usage

The following example prints the data for the last order placed in the first shop (accessible for your auth token's scope).

``` js
const bootic = require('bootic')

bootic
  .auth('bearer', { accessToken: 'aabbcc...xxyyzz' })
  .then(function(root) {
    return root.shops.first()
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
  .auth({ clientId: '123abc...', clientSecret: 'zxy321...' }) // credentials strategy
  .then(function(root) {
    // both callback and promises are allowed.
    root.shops.first(function(shop) {
      console.log(`Processing ${shop.subdomain}`) // Entity attribute

      // follow `products` link, that returns a collection and iterate over items
      shop.products.where(collection: 'Offers').each(function(product) {

        // and call the `update` action
        product.update(status: 'hidden').then(function(res) {
          console.log(res)
        })
      })
    })
```

# API

`.auth(strategy, opts)`

Initializes the client with the given options and `strategy` provided. `strategy` can be either `bearer`, `credentials` or `authorized`, or even skipped, in which case the strategy is deduced from the given credentials.

Options:

 - `accessToken`: Required for `bearer` and `authorized` strategies.
 - `clientId`: For `credentials` and `authorized` strategies.
 - `clientSecret`: Same as above.
 - `rootUrl`: To use an alternate endpoint for the API root.
 - `strategy`: Yes, you can also pass it as an option.

# Install

    npm install -g bootic (or yarn add)

# Using the client

Starting from the root Element (initialized using the response from the API's `rootUrl`), an Element has `attributes` (strings, numbers, dates, etc), `links`, and `embedded` items (which can be either other `Elements` or `Collections` of Elements). Links can either return other `Elements` or `Collections`, as with `embedded` items, but they can also perform actions on the current `Element` in which case a success/error status is returned.

This client supports chaining methods from Elements and Collections until a method is finally called. This means that both Elements and Collections can either be `Embedded` (its contents are known, since the data has already been received), `Linked` (unknown contents, linked from the current `Element`) or even `Virtual` (when the caller isn't Embedded but Virtual, e.g. `contact` in `shop.orders.first.contact`). 

## `Entity`
-----------------------------

### [Entity].get

--> Retrieves an entity's attributes and related links and embedded items.

    root.account.get(function(account) {
      console.log(account); // 
    })


## `Collection`

### [Collection].where(query)

--> Requests a link with params. Returns Collection. 

    root.shops.where(subdomain: 'foo')...

### [Collection].sort(cb)

// TODO

### [Collection].all(cb)

--> Returns the full set of items for a Collection.

    root.shops.all(function(shops) {
      console.log(shops) // [Collection]
    })

### [Collection].first(cb) 

--> Returns the first item of a collection.

### [Collection].last(cb) 

--> Returns the last item of a collection.

### [Collection].each(cb)

--> Iterates over each of a collection's items. 

    root.shops.forEach(function(shop) {
      console.log(shop) // [Entity]
    })

## Examples
-----------------------------

Check the `examples` directory contained in this repository.

## Contributing

Just with silence for the time being. This is kind of experimental stuff so until the interface stabilizes a bit I won't accept any patches.

## Copyright

(c) Tomas Pollak, Inventario SpA. Licensed under the Mozilla Public License (MPL).

