const i18n = require('i18n');
const path = require('path');
const config = require('config'); 

i18n.configure({
    locales: ['en', 'es', 'pt'],
    directory: path.join(__dirname, 'locales'),
    defaultLocale: config.get('cms_config').defaultLanguage, //set you default language
    objectNotation: true
  });

module.exports = i18n;
