var should = require('should'),
   Element = require('../lib/elements'),
  rootData = require('./fixtures/root');

describe('root', function() {

  let root;

  function loadRoot(client , data) {
    return Element.root(client, data);
  }

  describe('initializing', function() {
    it('throws without client', function() {
      (function() {
        root = loadRoot(null, {})
      }).should.throw('Both client and data required.')
    })

    it('throws without data', function() {
      (function() {
        root = loadRoot({}, null)
      }).should.throw('Both client and data required.')
    })

    it('loads with valid objects', function() {
      root = loadRoot({}, {})
      should(root).be.a.Object();
    })

    it('loads with a real response', function() {
      root = loadRoot({}, rootData)
      should(root).be.a.Object();
    })
  })

  describe('proxying', function() {

    before(function() {
      root = loadRoot({}, rootData)
    })

    // pending
    it('throws if not found'); /* function() {
      (function() { root.foobar }).should.throw('foobar not found in Element')
    }) */

    it('proxies to attribute if found', function() {
      root.user_name.should.eql('linusbenedict');
    })

    it('returns proxied link if found', function() {
      var obj = root.docs;
      // should(obj).be.a.Object();
      obj.constructor.name.should.eql('LinkedAction')
    })

    it('returns embedded collection if found', function() {
      var obj = root.shops;
      // should(obj).should.be.a.Object();
      obj.constructor.name.should.eql('Collection')
    })

  })

})