# Collection
-----------------------------

## [Collection].where(query)

--> Requests a link with params. Returns Collection. 

    root.shops.where(subdomain: 'foo')...

## [Collection].all(cb)

--> Returns a whole collection of items. 

    root.shops.all(function(shops) {
      console.log(shops) // [Collection]
    })

## [Collection].first(cb) 

--> Returns the first item of a collection.

## [Collection].last(cb) 

--> Returns the last item of a collection.

## [Collection].forEach(cb)

--> Iterates over each of a collection's items. 

    root.shops.forEach(function(shop) {
      console.log(shop) // [Entity]
    })

## [Collection].map(cb)

--> Maps over each collection's element, creating a new array with the returned values. 

    var names = root.shops.map(function(shop) {
      return shop.name;
    })

# Element
-----------------------------

## [Element].get

--> Retrieves an element's attributes and related links and embedded items.

    root.account.get(function(account) {
      console.log(account); // 
    })


# Examples
-----------------------------

List products in shop:

    var myShop = client.root().then(function(root) { return root.shops[0] })
    var myProducts = myShop.then(function(shop) { return client.run(shop._links["btc:products"]) })

    myProducts.then(function(prods) {
      console.log('products', prods)
    })

Hide products in collection 'Offers':

    root.shops.first(function(shop) {
      console.log(`Processing ${shop.subdomain}`); // Entity attribute

      // follow `products` link, that returns a collection and iterate over items
      shop.products.where(collection: 'Offers').forEach(function(product) {

        // follow `hide` link
        product.hide.call();
      })
    })