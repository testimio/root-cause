module.exports = {
  overrideWebpackConfig: ({ webpackConfig, cracoConfig, pluginOptions, context: { env, paths } }) => {
    const probablyTheEntryWeLookFor = webpackConfig.module.rules.find((rule) => {
      return 'oneOf' in rule && Array.isArray(rule.oneOf);
    });

    if (!probablyTheEntryWeLookFor) {
      throw new Error('failed ensure inline');
    }

    const probablyTheLoaderWeLookFor = probablyTheEntryWeLookFor.oneOf.find((loaderEntry) =>
      loaderEntry.loader.includes('url-loader')
    );

    if (!probablyTheLoaderWeLookFor) {
      throw new Error('failed ensure inline');
    }

    // no limit, no matter the size, it will be inlined
    probablyTheLoaderWeLookFor.options.limit = undefined;
    probablyTheLoaderWeLookFor.test.push(/\.svg$/);

    // Inshallah
    return webpackConfig;
  },
};
