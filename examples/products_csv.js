var fs       = require('fs'),
    bootic   = require('../'),
    helpers  = require('./helpers'),
    args     = helpers.args();

var concurrency = 5,
    firstPageOnly = false;

var perPage = 60,
    csvOutput = '',
    lineSeparator = '\r\n',
    columnSeparator = ',';

var columns = [
  'id',
  'status',
  'title',
  'product_type',
  'vendor',
  'price',
  'price_comparison',
  'stock',
  'available_if_no_stock',
  'variant_id',
  'variant_sku',
  'variant_option1',
  'variant_option2',
  'variant_option3',
  'collection_list',
  'description'
]

/*
var csv_exporter_columns =[
  'id',
  'slug',
  'title',
  'vendor',
  'price',
  'price_comparison',
  'weight_in_grams',
  'status',
  'created_on',
  'updated_on',
  'currency',
  'product_type',
  'url',
  'variant_id',
  'variant_sku',
  'stock',
  'available_if_no_stock'
];

var columns =[
  'id',
  'slug',
  'title',
  'vendor',
  'price',
  'price_comparison',
  'weight_in_grams',
  'status',
  'created_on',
  'updated_on',
  'currency_code',
  'product_type',
  'url',
  'variant_id',
  'variant_sku',
  'variant_option1',
  'variant_option2',
  'variant_option3',
  'stock',
  'available_if_no_stock'
];
*/


if (!args.token && !args.clientId) {
  helpers.usage('products_csv.js');
}

function flatten(arr) {
  return arr.reduce(function (flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

// Each of the embedded double-quote characters must
// be represented by a pair of double-quote characters.
function escapeQuotes(str) {
  return str.replace(/"/g, '""')
}

function wrapInQuotes(str) {
  return '"' + escapeQuotes(str) + '"';
}
function decodeEntities(str) {
  var entityMap = { "nbsp":" ","iexcl":"¡","cent":"¢","pound":"£","curren":"¤","yen":"¥","brvbar":"¦","sect":"§","uml":"¨","copy":"©","ordf":"ª","laquo":"«","not":"¬","reg":"®","macr":"¯","deg":"°","plusmn":"±","sup2":"²","sup3":"³","acute":"´","micro":"µ","para":"¶","middot":"·","cedil":"¸","sup1":"¹","ordm":"º","raquo":"»","frac14":"¼","frac12":"½","frac34":"¾","iquest":"¿","Agrave":"À","Aacute":"Á","Acirc":"Â","Atilde":"Ã","Auml":"Ä","Aring":"Å","AElig":"Æ","Ccedil":"Ç","Egrave":"È","Eacute":"É","Ecirc":"Ê","Euml":"Ë","Igrave":"Ì","Iacute":"Í","Icirc":"Î","Iuml":"Ï","ETH":"Ð","Ntilde":"Ñ","Ograve":"Ò","Oacute":"Ó","Ocirc":"Ô","Otilde":"Õ","Ouml":"Ö","times":"×","Oslash":"Ø","Ugrave":"Ù","Uacute":"Ú","Ucirc":"Û","Uuml":"Ü","Yacute":"Ý","THORN":"Þ","szlig":"ß","agrave":"à","aacute":"á","acirc":"â","atilde":"ã","auml":"ä","aring":"å","aelig":"æ","ccedil":"ç","egrave":"è","eacute":"é","ecirc":"ê","euml":"ë","igrave":"ì","iacute":"í","icirc":"î","iuml":"ï","eth":"ð","ntilde":"ñ","ograve":"ò","oacute":"ó","ocirc":"ô","otilde":"õ","ouml":"ö","divide":"÷","oslash":"ø","ugrave":"ù","uacute":"ú","ucirc":"û","uuml":"ü","yacute":"ý","thorn":"þ","yuml":"ÿ","fnof":"ƒ","Alpha":"Α","Beta":"Β","Gamma":"Γ","Delta":"Δ","Epsilon":"Ε","Zeta":"Ζ","Eta":"Η","Theta":"Θ","Iota":"Ι","Kappa":"Κ","Lambda":"Λ","Mu":"Μ","Nu":"Ν","Xi":"Ξ","Omicron":"Ο","Pi":"Π","Rho":"Ρ","Sigma":"Σ","Tau":"Τ","Upsilon":"Υ","Phi":"Φ","Chi":"Χ","Psi":"Ψ","Omega":"Ω","alpha":"α","beta":"β","gamma":"γ","delta":"δ","epsilon":"ε","zeta":"ζ","eta":"η","theta":"θ","iota":"ι","kappa":"κ","lambda":"λ","mu":"μ","nu":"ν","xi":"ξ","omicron":"ο","pi":"π","rho":"ρ","sigmaf":"ς","sigma":"σ","tau":"τ","upsilon":"υ","phi":"φ","chi":"χ","psi":"ψ","omega":"ω","thetasym":"ϑ","upsih":"ϒ","piv":"ϖ","bull":"•","hellip":"…","prime":"′","Prime":"″","oline":"‾","frasl":"⁄","weierp":"℘","image":"ℑ","real":"ℜ","trade":"™","alefsym":"ℵ","larr":"←","uarr":"↑","rarr":"→","darr":"↓","harr":"↔","crarr":"↵","lArr":"⇐","uArr":"⇑","rArr":"⇒","dArr":"⇓","hArr":"⇔","forall":"∀","part":"∂","exist":"∃","empty":"∅","nabla":"∇","isin":"∈","notin":"∉","ni":"∋","prod":"∏","sum":"∑","minus":"−","lowast":"∗","radic":"√","prop":"∝","infin":"∞","ang":"∠","and":"∧","or":"∨","cap":"∩","cup":"∪","int":"∫","there4":"∴","sim":"∼","cong":"≅","asymp":"≈","ne":"≠","equiv":"≡","le":"≤","ge":"≥","sub":"⊂","sup":"⊃","nsub":"⊄","sube":"⊆","supe":"⊇","oplus":"⊕","otimes":"⊗","perp":"⊥","sdot":"⋅","lceil":"⌈","rceil":"⌉","lfloor":"⌊","rfloor":"⌋","lang":"〈","rang":"〉","loz":"◊","spades":"♠","clubs":"♣","hearts":"♥","diams":"♦","\"":"quot","amp":"&","lt":"<","gt":">","OElig":"Œ","oelig":"œ","Scaron":"Š","scaron":"š","Yuml":"Ÿ","circ":"ˆ","tilde":"˜","ndash":"–","mdash":"—","lsquo":"‘","rsquo":"’","sbquo":"‚","ldquo":"“","rdquo":"”","bdquo":"„","dagger":"†","Dagger":"‡","permil":"‰","lsaquo":"‹","rsaquo":"›","euro":"€" };
  var entityMapRegex = new RegExp("&(" + Object.keys(entityMap).join("|") + ");", "g");
  return str.replace(entityMapRegex, function(x) {
    return entityMap[x.substring(1, x.length-1)] || x;
  });
}

function cleanDescription(desc) {
  // remove HTML and ensure no line separators in betweenn
  var clean = desc.replace(/<\/?[^>]*>/g, '').replace(/\r\n/g, '\n');
  return wrapInQuotes(decodeEntities(clean));
}

function buildCSV(cols, firstPage, done) {
  var res, csv = cols.join(columnSeparator) + lineSeparator;

  function fetchDesc(product, cb) {
    console.log(' -- Fetching desc for product', product.slug)
    product._client.request(product._links['self'], {}).then(function(res) {
      cb(res.description);
    })
  }

  function buildRows(product, cb) {
    fetchDesc(product, function(desc) {
      product.description     = cleanDescription(desc);
      product.product_type    = product.type.name;
      product.collection_list = product.collections.map(function(col) {
        return col.title;
      }).join(' / ')

      var rows = product.variants.map(function(variant) {
        return cols.map(function(key) {
          if (key == 'id' || key == 'title')
            res = product[key];
          else if (~key.indexOf('variant_'))
            res = variant[key.replace('variant_', '')]
          else
            res = variant.hasAttr(key) ? variant[key] : product[key]

          // console.log(key + ' --> ' + res);
          return res;
        }).join(columnSeparator)
      });

      cb(rows);
    })
  }

  function processBatch(productList) {
    var working = 0, arr = productList;
    console.log('== Processing batch of ' + arr.length);

    function appendRows(rows) {
      // console.log('got rows', rows);
      csv += flatten(rows).join(lineSeparator) + lineSeparator;
      --working;
      nextProduct()
    }

    function nextProduct() {
      var product = arr.pop();

      if (product) {
        working++;
        buildRows(product, appendRows)
      } else if (working === 0) {
        if (!firstPageOnly && productList.hasNextPage)
          productList.nextPage(processBatch);
        else
          done(csv)
      }
    }

    // tomas' super concurrency model ;)
    for (var i = 0; i < concurrency; i++)
      nextProduct()
  }

  processBatch(firstPage);
}

process.on('unhandledRejection', function(reason, p) {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
})

var current_shop;

bootic
  .auth(args)
  .then(function(root) {
    return helpers.getShop(root, (args.shop || args.subdomain))
  })
  .then(function(shop) {
    if (!shop)
      throw new Error('Shop not found: ' + (args.shop || args.subdomain))

    current_shop = shop;
    return shop.products.limit(perPage).all()
  })
  .then(function(productList) {
    buildCSV(columns, productList, function(out) {
      console.log('Finished!')
      fs.writeFileSync('out.csv', out)
    });
  })
  .catch(function(err) {
    console.log('err!', err)
  })

