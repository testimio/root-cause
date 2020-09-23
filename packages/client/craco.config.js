const libraryCracoPlugin = require('./libraryCracoPlugin');
const ForceInlineStaticsCracoPlugin = require('./ForceInlineStaticsCracoPlugin');

module.exports = {
  plugins: [{ plugin: libraryCracoPlugin }, { plugin: ForceInlineStaticsCracoPlugin }],
};
