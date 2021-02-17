# Bootic JS API Client

Modern client for the [Bootic API](https://api.bootic.net), written in pure vanilla Javascript.

# Usage

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

## Install

    npm install -g bootic (or yarn add)

## Using the client

Starting from the root Element (initialized using the response from the API's `rootUrl`), an Element has `attributes` (strings, numbers, dates, etc), `links`, and `embedded` items (which can be either other `Elements` or `Collections` of Elements). Links can either return other `Elements` or `Collections`, as with `embedded` items, but they can also perform actions on the current `Element` in which case a success/error status is returned.

This client supports chaining methods from Elements and Collections until a method is finally called. This means that both Elements and Collections can either be `Embedded` (its contents are known, since the data has already been received), `Linked` (unknown contents, linked from the current `Element`) or even `Virtual` (when the caller isn't Embedded but Virtual, e.g. `contact` in `shop.orders.first.contact`).

## Authentication

`.auth(strategy, opts)`

Initializes the client with the given options and `strategy` provided. `strategy` can be either `bearer`, `credentials` or `authorized`, or even skipped, in which case the strategy is deduced from the given credentials.

Options:

 - `accessToken`: Required for `bearer` and `authorized` strategies.
 - `clientId`: For `credentials` and `authorized` strategies.
 - `clientSecret`: Same as above.
 - `rootUrl`: To use an alternate endpoint for the API root.
 - `strategy`: Yes, you can also pass it as an option.

## Examples

Check the `examples` directory contained in this repository.

## Contributing

Just with silence for the time being. This is kind of experimental stuff so until the interface stabilizes a bit I won't accept any patches.

## Copyright

(c) Tomas Pollak, Inventario SpA. Licensed under the Mozilla Public License (MPL).
