"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clean_webpack_plugin_1 = require("clean-webpack-plugin");
const copy_webpack_plugin_1 = __importDefault(require("copy-webpack-plugin"));
const dotenv_webpack_1 = __importDefault(require("dotenv-webpack"));
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const monaco_editor_webpack_plugin_1 = __importDefault(require("monaco-editor-webpack-plugin"));
const path_1 = __importDefault(require("path"));
const terser_webpack_plugin_1 = __importDefault(require("terser-webpack-plugin"));
const cwd = process.cwd();
const dotenvPath = process.env.__DOTENV_PATH__ || undefined;
const entry = process.env.__WEBPACK_ENTRY__;
if (!entry) {
    throw new Error('Missing required env __WEBPACK_ENTRY__');
}
const configuration = {
    mode: 'production',
    target: ['web', 'es5'],
    devtool: false,
    context: cwd,
    entry: path_1.default.resolve(cwd, entry),
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
        new dotenv_webpack_1.default({
            path: dotenvPath,
            defaults: true,
            silent: true,
        }),
        new html_webpack_plugin_1.default({ template: 'index.html' }),
        new clean_webpack_plugin_1.CleanWebpackPlugin(),
        new terser_webpack_plugin_1.default({
            parallel: true,
            terserOptions: {
                output: {
                    comments: false,
                },
            },
            extractComments: false,
        }),
        new monaco_editor_webpack_plugin_1.default({
            filename: 'js/[name].worker.js',
        }),
        new copy_webpack_plugin_1.default({
            patterns: [{ from: 'static', to: 'static' }],
        }),
    ],
};
if (process.env.__ENABLE_WEBPACK_BUNDLE_ANALYZER__) {
    const WebpackBundleAnalyzer = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    configuration.plugins.push(new WebpackBundleAnalyzer());
}
if (process.env.__ENABLE_WEBPACK_COMPRESSION__) {
    const CompressionPlugin = require('compression-webpack-plugin');
    configuration.plugins.push(new CompressionPlugin({
        test: /\.(js|css)$/,
    }));
}
module.exports = configuration;
