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

// Set publicPath based on environment
moduleFederationConfig.output.publicPath = '/evaluacionempleado/'
//moduleFederationConfig.output.publicPath = '/'
//moduleFederationConfig.output.publicPath =  process.env.NODE_ENV === 'production'
//  ? '/evaluacionempleado/' // Production path
//  : '/'; // Development path - let webpack figure out the path automatically
module.exports =moduleFederationConfig
