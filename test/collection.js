var sinon      = require('sinon'),
    should     = require('should'),
    Entities   = require('../lib/entities'),
    ordersData = require('./fixtures/orders');

process.on('unhandledRejection', function(reason, p) {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
})

describe('Collection', function() {

  this.timeout(100)

  let coll;
  let client = {
    request: function(url, params) { }
  }

/*
  var responseFn = function(url, params) {
    return new Promise(function(resolve, reject) {
      var data = getProductData()

      if (!params || Object.keys(queryParams(params)).length == 0)
        return resolve(data)

      data._embedded.items = filterItems(data._embedded.items, queryParams(params));
      resolve(data);
    })
  }
*/

  before(function() {
    // stub = sinon.stub(client, 'request').callsFake(responseFn)
    coll = Entities.embeddedProxy(client, 'orders', ordersData._embedded.items);
    // console.log(coll);
  })

  describe('all', function() {

    function testResult(obj) {
      var done = this;
      obj.constructor.name.should.eql('Array');
      obj.length.should.eql(30);
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

    function testResult(obj) {
      var done = this;
      obj.constructor.name.should.eql('Entity');
      obj.code.should.eql('T4B13B0');
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
    it('supports proxying to virtual Entities or collections', function() {
      var vel = coll.first.something;
      vel.constructor.name.should.eql('VirtualEntity');

      var vcol = coll.first.images;
      vcol.constructor.name.should.eql('VirtualCollection');
    })
*/

  })

  describe('last', function() {

    function testResult(obj) {
      var done = this;
      obj.constructor.name.should.eql('Entity');
      obj.code.should.eql('T24D236');
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
    it('supports proxying to virtual Entities or collections', function() {
      var vel = coll.last.something;
      vel.constructor.name.should.eql('VirtualEntity');

      var vcol = coll.last.images;
      vcol.constructor.name.should.eql('VirtualCollection');
    })
*/

  })

  describe('each', function() {

    it('explodes if no callback given', function() {
      (function() { coll.each() }).should.throw('Callback required!')
    })

    it('returns nothing and yields items', function(done) {
      var times = 0;

      var res = coll.each(function(item, n) {
        item.constructor.name.should.eql('Entity');
        times++;
        n.should.eql(times-1);
      }, function after() {
        times.should.eql(30)
        done()
      })

      should.not.exist(res);
    })

  })

  describe('where', function() {

    it('explodes if no argument given', function() {
      (function() { coll.where() }).should.throw('Object expected, not undefined')
    })

    it('explodes if non object given', function() {
      (function() { coll.where('aaa') }).should.throw('Object expected, not string')
    })

    it('it adds a filtering param, and returns the original object', function(done) {
      var res = coll.where({ status: 'checkout' })
      res.constructor.name.should.eql('Collection')

      res.all().then(function(items) {
        items.constructor.name.should.eql('Array');
        items.length.should.eql(17);
        done()
      })
    })

    it('it clears any previous filtering params set', function(done) {
      coll.where({ foo: 'bar' })
      coll.where({ status: 'pending' })
      coll._params.should.eql({ status: 'pending' })

      coll.all(function(items) {
        items.constructor.name.should.eql('Array');
        items.length.should.eql(10);
        done()
      })
    })

  })

  describe('find', function() {

    function testResult(obj) {
      var done = this;
      obj.constructor.name.should.eql('Entity');
      obj.code.should.eql('T49AD86');
      done()
    }

    it('explodes if no argument given', function() {
      (function() { coll.find() }).should.throw('ID required')
    })

    it('doesnt explode if not found', function() {
      (function() { coll.find('111', function(){ }) }).should.not.throw()
    })

    it('returns a promise if called without a callback', function(done) {
      var res = coll.find('93')
      res.constructor.name.should.eql('Promise');
      res.then(testResult.bind(done))
    })

    it('doesnt return a promise if callback is passed', function(done) {
      var res = coll.find(93, testResult.bind(done))
      should.not.exist(res);
    })

  })


})