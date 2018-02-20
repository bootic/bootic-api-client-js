var should = require('should'),
    sinon  = require('sinon'),
   Element = require('../lib/elements');

var rootData = require('./fixtures/root'),
    productData = require('./fixtures/products');

describe('LinkedCollection', function() {

  let root, coll, stub;
  let client = {
    request: function(url, params) {}
  };

  function filterItems(items, params) {
    return items.filter(function(el) {
      for (var key in params) {
        if (el.hasOwnProperty(key) && el[key] == params[key])
          return true
      }
    })
  }

  function getProductData() {
    return JSON.parse(JSON.stringify(productData)); // returns a clone
  }

  var responseFn = function(url, params) {
    return new Promise(function(resolve, reject) {
      var data = getProductData()

      if (!params || !Object.keys(params).length)
        return resolve(data)

      data._embedded.items = filterItems(data._embedded.items, params);
      resolve(data);
    })
  }

  before(function() {
    stub = sinon.stub(client, 'request').callsFake(responseFn)
    root = Element.root(client, rootData);
    coll = root.all_products;
    coll.constructor.name.should.eql('LinkedCollection')
  })

  describe('all', function() {

    function testResult(res) {
      var done = this;
      res.constructor.name.should.eql('Array');
      res.length.should.eql(13);
      done()
    }

    it('returns a promise if called without a callback', function(done) {
      var res = coll.all()
      res.constructor.name.should.eql('Promise');
      res.then(testResult.bind(done))
    })

    it('doesnt return a promise if callback is passed', function(done) {
      var res = coll.all(testResult.bind(done))
      should.not.exist(res);
    })

  })

  describe('first', function() {

    function testResult(res) {
      var done = this;
      res.constructor.name.should.eql('Element');
      res.slug.should.eql('product-3');
      done()
    }

    it('returns a promise if called without a callback', function(done) {
      var res = coll.first()
      res.constructor.name.should.eql('Promise');
      res.then(testResult.bind(done))
    })

    it('doesnt return a promise if callback is passed', function(done) {
      var res = coll.first(testResult.bind(done))
      should.not.exist(res);
    })

/*
    it('supports proxying to virtual elements or collections', function() {
      var vel = coll.first.something;
      vel.constructor.name.should.eql('VirtualElement');

      var vcol = coll.first.images;
      vcol.constructor.name.should.eql('VirtualCollection');
    })
*/

  })

  describe('last', function() {

    function testResult(res) {
      var done = this;
      res.constructor.name.should.eql('Element');
      res.slug.should.eql('pin-ka');
      done()
    }

    it('returns a promise if called without a callback', function(done) {
      var res = coll.last()
      res.constructor.name.should.eql('Promise');
      res.then(testResult.bind(done))
    })

    it('doesnt return a promise if callback is passed', function(done) {
      var res = coll.last(testResult.bind(done))
      should.not.exist(res);
    })

/*
    it('supports proxying to virtual elements or collections', function() {
      var vel = coll.last.something;
      vel.constructor.name.should.eql('VirtualElement');

      var vcol = coll.last.images;
      vcol.constructor.name.should.eql('VirtualCollection');
    })
*/

  })

  describe('each', function() {

    it('explodes if no callback given', function() {
      (function() { coll.each() }).should.throw('Callback required!')
    })

    it('yields items', function(done) {
      var times = 0;
      coll.each(function(item, n) {
        item.constructor.name.should.eql('Element');
        times++;
        n.should.eql(times-1);
      })
      times.should.eql(13)
      done()
    })

  })

  describe('where', function() {

    it('explodes if no argument given', function() {
      (function() { coll.where() }).should.throw('Object expected!')
    })

    it('explodes if non object given', function() {
      (function() { coll.where('aaa') }).should.throw('Object expected!')
    })

    it('it adds a filtering param, and returns the original object', function(done) {
      var res = coll.where({ slug: 'qwe' })
      res.should.eql(coll);

      res.all().then(function(items) {
        items.constructor.name.should.eql('Array');
        items.length.should.eql(1);
        done()
      })
    })

    it('it clears any previous filtering params set', function(done) {
      coll.where({ foo: 'bar' })
      coll.where({ stock: 0 })
      coll._params.should.eql({ stock: 0 })

      coll.all(function(items) {
        items.constructor.name.should.eql('Array');
        items.length.should.eql(2);
        done()
      })
    })

  })


  describe('find', function() {

    before(function() {
      stub.restore()
      stub = sinon.stub(client, 'request').callsFake(function(url, params) {
        return new Promise(function(resolve, reject) {
          var data = getProductData()
          resolve(data._embedded.items[0])
        })
      })
    })

    function testResult(res) {
      var done = this;
      res.constructor.name.should.eql('Element');
      res.slug.should.eql('product-3');
      done()
    }

    it('explodes if no argument given', function() {
      (function() { coll.find() }).should.throw('ID required')
    })

    it('returns a promise if called without a callback', function(done) {
      var res = coll.find(12)
      res.constructor.name.should.eql('Promise');
      res.then(testResult.bind(done))
    })

    it('doesnt return a promise if callback is passed', function(done) {
      var res = coll.find(12, testResult.bind(done))
      should.not.exist(res);
    })

  })

})
