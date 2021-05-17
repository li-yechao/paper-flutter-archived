import path from 'path'
import { Configuration } from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin'
import Dotenv from 'dotenv-webpack'

const cwd = process.cwd()

const dotenvPath = process.env.__DOTENV_PATH__ || undefined

const entry = process.env.__WEBPACK_ENTRY__
if (!entry) {
  throw new Error('Missing required env __WEBPACK_ENTRY__')
}

const configuration: Configuration = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  context: cwd,
  entry: ['react-hot-loader/patch', path.resolve(cwd, entry)],
  output: {
    filename: 'js/[name].js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
    alias: { 'react-dom': '@hot-loader/react-dom' },
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
    new ForkTsCheckerWebpackPlugin(),
    new MonacoWebpackPlugin({
      filename: 'js/[name].worker.js',
    }),
  ],
}

module.exports = configuration
