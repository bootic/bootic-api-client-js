# Bootic JS API Client

Pure Javascript, modern client for the [Bootic API](https://api.bootic.net), for Node.js and the browser.

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

## Install

    npm install -g bootic (or yarn add)

## Authentication

In order to access the API your need to create an application or enable the developer sandbox at [https://auth.bootic.net](auth.bootic.net). 

Once you've done so, you initialize the client by calling:

`.auth(strategy, options)`

Which initializes the client with the given `options` and `strategy` provided. `strategy` can be either `bearer`, `credentials` or `authorized`, or even skipped, in which case the strategy is deduced from the given credentials. For example:

`.auth('bearer', { accessToken: 'aabbcc...xxyyzz' })`

Or simply (if using the credentials strategy):

`.auth({ clientId: '123abc...', clientSecret: 'zxy321...' })`

The available options are:

 - `accessToken`: Required for `bearer` and `authorized` strategies. You can generate temporary tokens by enabling the [https://auth.bootic.net/dev/sandbox](developer sandbox).
 - `clientId`: For `credentials` and `authorized` strategies. You need to [https://auth.bootic.net/dev/apps](create a Bootic OAuth2 app) to get this.
 - `clientSecret`: Same as above.
 - `rootUrl`: To use an alternate endpoint for the API root. You probably won't use this.
 - `strategy`: Yes, you can also pass it as an option. Not required.

For a detailed description about the supported OAuth2 strategies, please check the [Authentication section](https://api.bootic.net/api/authentication/) from our API documentation.

## Using the client

Once authorized, you start from the root Element (initialized using the response from the API's `rootUrl`), which contains the entry points for the different available APIs for your account, as well as embedded data (auth and account information, linked shops, etc). You can then access this data or endpoints as properties or methods for the promise's returned object. For instance:

```
bootic
  .auth('bearer', { accessToken: 'aabbcc...xxyyzz' })
  .then(function(root) {
    // root cointains the root entry points and embedded data
    console.log(root.account.status)
    root.products.find(1234).then(function(product) {  
      // product contains the product's data and available/related actions
      // in this case we'll call the .update action that will internally perform a PATCH request
      product.update(online_stock: 10)
    })
  })
```

An easy way to visualize the entry point and linked actions is by using our API's HAL browser at [https://api.bootic.net/browser/](api.bootic.net/browser/).

## Client entities (Element, Collection, etc)

An Element has `attributes` (strings, numbers, dates, etc), `links`, and `embedded` items (which can be either other `Elements` or `Collections` of Elements). Links can either return other `Elements` or `Collections`, as with `embedded` items, but they can also perform actions on the current `Element` in which case a success/error status is returned.

This client supports chaining methods from Elements and Collections until a method is finally called. This means that both Elements and Collections can either be `Embedded` (its contents are known, since the data has already been received), `Linked` (unknown contents, linked from the current `Element`) or even `Virtual` (when the caller isn't Embedded but Virtual, e.g. `contact` in `shop.orders.first.contact`).

## CLI

Yes, this client sports a nice CLI interface that lets you perform stuff interactively. If you install the package globablly just run `bootic` and voilá!

## Examples

Check the `examples` directory contained in this repository. 

## Contributing

Report bugs at first sight! This is my first dive into the [Proxy object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) so your ride might get bumpy.

Please note that the interface might change in the future, so make sure to write tests (and run them) when you upgrade to a new major version (X.0.0).

## Copyright

(c) Tomas Pollak, Inventario SpA. Licensed under the Mozilla Public License (MPL).
