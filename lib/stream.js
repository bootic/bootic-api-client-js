const accessToken = process.argv[2]
if (!accessToken) {
  console.log('Token required');
  process.exit(1)
}

if (typeof fetch == 'undefined') {
  var fetch = require('node-fetch-polyfill');
  require('http').globalAgent.keepAlive = true;
}

function basicAuth(pass) {
  var encoded = new Buffer('x:' + pass).toString('base64')
  return encoded;
}

function stream(url, opts, cb, done) {
  var headers = {
    'Authorization': 'Basic ' + basicAuth(opts.password)
  }

  return fetch(url, { headers: headers }).then(function(response) {
    var obj, reader = response.body.getReader();

    if (response.status > 300)
      throw new Error('Invalid response code: ' + response.status)

    function decode(str) {
      var data;
      try { data = JSON.parse(str.toString()) } catch(e) { }
      return data;
    }

    function next() {
      return reader.read().then(function(result) {
        obj = decode(result.value);
        if (obj) cb(obj)

        if (result.done) throw Error("Looks like we're done.");
        return next();
      })
    }

    return next();

  }).then(function(result) {
    done(null, result)

  }).catch(function(err) {
    done(err)
  });
}

function onEvent(eventType, cb) {
  var url = 'https://tracker.bootic.net/stream?raw=1';
  var opts = { password: accessToken };

  return stream(url, opts, function(event) {
    if (event.type == eventType)
      cb(event.data, event.time)
  }, function(err, result) {
    console.log('Done!', err || result);
  })
}

onEvent('pageview', function(pageView, timeStamp) {
  var browser = pageView.browser || { name: 'Unknown browser', os: 'Probably Linux' };
  console.log(' --> ' + pageView.r + ' using ' + browser.name + ' on ' + browser.os)
})