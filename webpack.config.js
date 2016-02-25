var webpack = require('webpack');

var min = process.argv.indexOf('-p') > 0 ? '.min' : '';
var plugins = [];

plugins.push(new webpack.DefinePlugin({
  'process.env': {
    CI: JSON.stringify(!!process.env.CI),
    NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
  }
}));

// 使用了 webpack -p 其实不加这个 plugin 也行，我主要是为了可以配置 uglify
if (min) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compressor: {
      warnings: false,
      unused: true,
      'drop_console': true
    }
  }));
}


var config = {
  entry: {'elegant-api': './src/index.jsx'},

  devtool: min ? null : 'source-map',

  output: {
    filename: '[name]' + min + '.js',
    path: './dist/',
    library: 'elegantApi',
    libraryTarget: 'umd'
  },

  resolve: {
    extensions: ['.jsx', '.js', '.json', '']
  },

  plugins: plugins,

  module: {
    loaders: [
      { test: /\.jsx$/, exclude: /node_modules/, loaders: ['es3ify', 'babel']}
    ]
  }
};


module.exports = config;
