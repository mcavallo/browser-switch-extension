const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    background: './src/background.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: [
              'env'
            ],
            plugins: [
              'transform-es2015-modules-commonjs',
              'babel-plugin-transform-es2015-destructuring',
              ["babel-plugin-transform-object-rest-spread", { useBuiltIns: true }]
            ]
          }
        }
      }
    ]
  },
  stats: {
    children: false,
    chunks: false,
    chunkModules: false,
    chunkOrigins: false,
    modules: false
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: './src/manifest.json' },
      { context: './src/icons', from: '*.png', to: 'icons' }
    ])
  ]
}
