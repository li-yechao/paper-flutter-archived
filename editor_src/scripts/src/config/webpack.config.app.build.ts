import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import CopyPlugin from 'copy-webpack-plugin'
import DotenvWebpackPlugin from 'dotenv-webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MonacoEditorWebpackPlugin from 'monaco-editor-webpack-plugin'
import path from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import { Configuration } from 'webpack'

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
    new DotenvWebpackPlugin({
      path: dotenvPath,
      defaults: true,
      silent: true,
    }),
    new HtmlWebpackPlugin({ template: 'index.html' }),
    new CleanWebpackPlugin(),
    new MonacoEditorWebpackPlugin({
      filename: 'js/[name].worker.js',
    }),
    new CopyPlugin({
      patterns: [{ from: 'static', to: 'static' }],
    }) as any,
    new TerserPlugin({
      parallel: true,
      terserOptions: {
        output: {
          comments: false,
        },
      },
      extractComments: false,
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
