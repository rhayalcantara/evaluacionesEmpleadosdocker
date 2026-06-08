const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

const moduleFederationConfig = withModuleFederationPlugin({
  remotes: {
    "loginapp":   "/loginapp/remoteEntry.js"    
     /*process.env.NODE_ENV === 'production' 
      ? "/loginapp/remoteEntry.js"  // Production URL
      :  "http://localhost:4300/remoteEntry.js" // Local development URL (uses proxy)
      */
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
  sharedMappings:["@commons-lib"]
});

moduleFederationConfig.output.pathinfo = false;
moduleFederationConfig.output.clean = true;

// PUBLIC_PATH env var allows deploying to a different base path (e.g. prueba environment)
moduleFederationConfig.output.publicPath = process.env.PUBLIC_PATH || '/evaluacionempleado/';
module.exports =moduleFederationConfig
