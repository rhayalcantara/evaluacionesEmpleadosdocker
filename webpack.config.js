const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

const moduleFederationConfig = withModuleFederationPlugin({
  remotes: {
    "loginapp": process.env.NODE_ENV === 'production' 
      ? "http://192.168.7.222/loginapp/remoteEntry.js"  // Production URL
      : "/loginapp/remoteEntry.js", // Local development URL (uses proxy)
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
  sharedMappings:["@commons-lib"]
});

moduleFederationConfig.output.pathinfo = false;
moduleFederationConfig.output.clean = true;

// Set publicPath based on environment
moduleFederationConfig.output.publicPath = process.env.NODE_ENV === 'production'
  ? '/evaluacionempleado/' // Production path
  : 'auto'; // Development path - let webpack figure out the path automatically
module.exports =moduleFederationConfig
