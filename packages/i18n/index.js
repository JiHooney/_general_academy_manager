// Auto-export all locale JSONs for consumption by apps
const en = require('./locales/en.json');
const ko = require('./locales/ko.json');
const ja = require('./locales/ja.json');
const zhHant = require('./locales/zh-Hant.json');
const zhHans = require('./locales/zh-Hans.json');
const fr = require('./locales/fr.json');

module.exports = { en, ko, ja, 'zh-Hant': zhHant, 'zh-Hans': zhHans, fr };
