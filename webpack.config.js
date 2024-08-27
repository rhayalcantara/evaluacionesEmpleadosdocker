const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

const moduleFederationConfig = withModuleFederationPlugin({

  remotes: {
    //"loginapp": "/loginapp/remoteEntry.js", 
    //"loginapp": "http://192.168.7.222/loginapp/remoteEntry.js", 
    "loginapp": "http:localhost:4300/remoteEntry.js",       
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
  sharedMappings:["@commons-lib"]
});

moduleFederationConfig.output.pathinfo = false
moduleFederationConfig.output.clean = true
 moduleFederationConfig.output.publicPath = '/'
// moduleFederationConfig.output.publicPath = '/expedientes/'
module.exports =moduleFederationConfig