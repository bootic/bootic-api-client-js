import buble from 'rollup-plugin-buble'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify'
import replace from 'rollup-plugin-replace'

// import globals from 'rollup-plugin-node-globals'
import builtins from 'rollup-plugin-node-builtins'
// import hash from 'rollup-plugin-hash';
// import livereload from 'rollup-plugin-livereload'
// import serve from 'rollup-plugin-serve'

var fs = require('fs'),
    path = require('path'),
    createHash = require('crypto').createHash;

var production = !!process.env.PRODUCTION;
var publicPath = 'dist';

function removeDirSync(path) {
  fs.readdirSync(path).forEach(function(file, index) {
    var curPath = path + "/" + file;
    if (fs.lstatSync(curPath).isDirectory()) // recurse
      removeDirSync(curPath);
    else
      fs.unlinkSync(curPath);
  });
  fs.rmdirSync(path);
};

// for polyfilling
function extend(origin, add) {
  if (!add || add.constructor.name != 'Object') return origin;
  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
}

function getConfig(script, varName, opts) {
  var plugins = [
    builtins(), // for 'querystring', 'url' and 'util' modules
    // globals(),
    replace({
      delimiters: ['', ''],
      values: {
        // remove fetch
        'var fetch' : '// var fetch',
        'require(\'http\').globalAgent.keepAlive' : 'var keepAlive',

        // remove debug
        "require('debug')('bootic')" : 'function(){}',

        // remove 'util' dependency
        "require('util')._extend": extend.toString()
      }
    }),
    nodeResolve({
      browser: true,
      main: true,
      module: false,
      jsnext: false
    }),
    commonjs({
      // include: 'node_modules/**',
      // exclude: ['node_modules/node-fetch-polyfill'],
      // exclude: ['node_modules/debug/'],
      browser: true,
      ignoreGlobal: true
    }),
    buble({
      exclude: 'node_modules/**',
      objectAssign: 'Object.assign' // _extend
    })
  ]

  if (opts.uglify) plugins.push(uglify.uglify())

  return {
    input: script,
    output: {
      name: varName, // script.replace('.js', ''),
      file: publicPath + '/' + (opts.outputFile || script),
      format: 'umd' // or cjs, iife, umd
    },
    plugins: plugins
  }
}

if (fs.existsSync(publicPath)) {
  console.log('Removing dir: ' + publicPath)
  removeDirSync(publicPath)
}

// second argument is name of variable (global.BooticClient)
var config = [
  getConfig('index.js', 'Bootic', { outputFile: 'bootic.js' }),
  getConfig('index.js', 'Bootic', { outputFile: 'bootic.min.js', uglify: true })
];

export default config;
