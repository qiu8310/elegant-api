var webpack = require('webpack');

var isBuildEAServer = process.env.BUILD_EA_SERVER;
var production = process.argv.indexOf('-p') > 0;
var min = production ? '.min' : '';

var entry, library;
if (!isBuildEAServer) {
  entry = {'elegant-api': './src/index.jsx'};
  library = 'elegantApi';
} else {
  entry = {'elegant-api-server': './src/ElegantApiServer.jsx'};
  library = 'ElegantApiServer';
}

var config = {
  entry: entry,

  devtool: production || isBuildEAServer ? null : 'source-map',

  output: {
    filename: '[name]' + min + '.js',
    path: './dist/',
    library: library,
    libraryTarget: 'umd'
  },

  resolve: {
    extensions: ['.jsx', '.js', '.json', '']
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        CI: JSON.stringify(!!process.env.CI),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
      }
    })
  ],

  module: {
    loaders: [
      { test: /\.jsx$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  }
};


module.exports = config;
