const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

const moduleFederationConfig = withModuleFederationPlugin({
  remotes: {
    "loginapp": "/loginapp/remoteEntry.js"
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
  sharedMappings: ["@commons-lib"]
});

moduleFederationConfig.output.pathinfo = false;
moduleFederationConfig.output.clean = true;
moduleFederationConfig.output.publicPath = '/evaluacionempleado-prueba/';

module.exports = moduleFederationConfig;
