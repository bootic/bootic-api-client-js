var should = require('should'),
    sinon  = require('sinon'),
   Element = require('../lib/elements'),
  rootData = require('./fixtures/root');

describe('LinkedCollection', function() {

  let root, coll, stub;
  let client = {
    request: function(url, params) {}
  };

  let result = {
    _class: [ 'results', 'products' ],
    _links:
     { curies: [ {} ],
       self:
        { href: 'http://localhost:5001/v1/products?page=1&per_page=30&status=visible' },
       'btc:shops':
        { href: 'http://localhost:5001/v1/shops/for_products?status=visible',
          title: 'Shops for the current product results' } },
    _actions:
     { search:
        { prompt: 'Search and filter products',
          method: 'GET',
          type: 'application/json',
          href: 'http://localhost:5001/v1/products',
          fields: [] } },
    _embedded:
     { facets: [],
       items: [ 'one', 'two', 'three'] },
    total_items: 22,
    per_page: 30,
    page: 1
  }

  before(function() {
    stub = sinon.stub(client, 'request').callsFake(function(url, params) {
      return new Promise(function(resolve, reject) {
        resolve(result)
      })
    })

    root = Element.root(client, rootData);
    coll = root.all_products;
    coll.constructor.name.should.eql('LinkedCollection')
  })

  describe('last', function() {

    it('returns a promise if called without a callback', function(done) {
      var res = coll.last()
      res.constructor.name.should.eql('Promise');
      res.then(function(val) {
        stub.restore()
        val.constructor.name.should.eql('Element');
        val._data.should.eql('three');
        done()
      })
    })

    it('doesnt return a promise if callback is passed', function(done) {
      var res = coll.last(function(val) {
        val.constructor.name.should.eql('Element');
        val._data.should.eql('three');
        done()
      })
      should.not.exist(res);
    })

  })

  describe('first', function() {

    it('returns a promise if called without a callback', function(done) {
      var res = coll.first()
      res.constructor.name.should.eql('Promise');
      res.then(function(val) {
        stub.restore()
        val.constructor.name.should.eql('Element');
        val._data.should.eql('one');
        done()
      })
    })

    it('doesnt return a promise if callback is passed', function(done) {
      var res = coll.first(function(val) {
        val.constructor.name.should.eql('Element');
        val._data.should.eql('one');
        done()
      })
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

    it('returns a promise if called without a callback', function(done) {
      var res = coll.last()
      res.constructor.name.should.eql('Promise');
      res.then(function(val) {
        stub.restore()
        val.constructor.name.should.eql('Element');
        val._data.should.eql('three');
        done()
      })
    })

    it('doesnt return a promise if callback is passed', function(done) {
      var res = coll.last(function(val) {
        val.constructor.name.should.eql('Element');
        val._data.should.eql('three');
        done()
      })
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

})
