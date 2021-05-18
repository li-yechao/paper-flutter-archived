import path from 'path'
import { Configuration } from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import TerserWebpackPlugin from 'terser-webpack-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import Dotenv from 'dotenv-webpack'
import CopyWebpackPlugin from 'copy-webpack-plugin'

const cwd = process.cwd()

const dotenvPath = process.env.__DOTENV_PATH__ || undefined

const entry = process.env.__WEBPACK_ENTRY__
if (!entry) {
  throw new Error('Missing required env __WEBPACK_ENTRY__')
}

const configuration: Configuration = {
  mode: 'production',
  target: ['web', 'es5'],
  devtool: false,
  context: cwd,
  entry: path.resolve(cwd, entry),
  output: {
    filename: 'js/[name].[contenthash].js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: require('./babel.config.app.serve'),
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              esModule: false,
              outputPath: 'fonts',
              name: '[name].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new Dotenv({
      path: dotenvPath,
      defaults: true,
      silent: true,
    }),
    new HtmlWebpackPlugin({ template: 'index.html' }),
    new CleanWebpackPlugin(),
    new TerserWebpackPlugin({
      parallel: true,
      terserOptions: {
        output: {
          comments: false,
        },
      },
      extractComments: false,
    }),
    new MonacoWebpackPlugin({
      filename: 'js/[name].worker.js',
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: 'static', to: 'static' }],
    }),
  ],
}

if (process.env.__ENABLE_WEBPACK_BUNDLE_ANALYZER__) {
  const WebpackBundleAnalyzer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  configuration.plugins!.push(new WebpackBundleAnalyzer())
}

if (process.env.__ENABLE_WEBPACK_COMPRESSION__) {
  const CompressionPlugin = require('compression-webpack-plugin')

  configuration.plugins!.push(
    new CompressionPlugin({
      test: /\.(js|css)$/,
    })
  )
}

module.exports = configuration
