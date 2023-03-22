const i18n = require('i18n');

i18n.configure({
    locales: ['en', 'es', 'pt'],
    directory: __dirname + '/locales',
    defaultLocale: 'en', 
    queryParameter: 'lang',
    cookie: 'locale' 
  });

module.exports = i18n;
