var bootic   = require('../'),
    helpers  = require('./helpers'),
    args     = helpers.args();

if (!args.token && !args.clientId) {
  helpers.usage('list_templates.js');
}

function listTemplatesIn(theme) {
  theme.templates.each(function(template) {
    console.log(template.file_name, template.body.length, template.updated_on)
  })
}

process.on('unhandledRejection', function(reason, p) {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
})

bootic
  .auth(args)
  .then(function(root) {
    return helpers.getShop(root, args.shop || args.subdomain)
  })
  .then(function(shop) {
    return shop.themes.get()
  })
  .then(function(themes) {
    if (themes.dev_theme) {
      console.log('Found dev theme!')
      return themes.dev_theme.get()
    }

    return themes.theme.get()
  })
  .then(function(theme) {
    listTemplatesIn(theme)
  })
  .catch(function(err) {
    console.log('err!', err)
  })
