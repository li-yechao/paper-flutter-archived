"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_webpack_1 = __importDefault(require("dotenv-webpack"));
const fork_ts_checker_webpack_plugin_1 = __importDefault(require("fork-ts-checker-webpack-plugin"));
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
const monaco_editor_webpack_plugin_1 = __importDefault(require("monaco-editor-webpack-plugin"));
const path_1 = __importDefault(require("path"));
const cwd = process.cwd();
const dotenvPath = process.env.__DOTENV_PATH__ || undefined;
const entry = process.env.__WEBPACK_ENTRY__;
if (!entry) {
    throw new Error('Missing required env __WEBPACK_ENTRY__');
}
const configuration = {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    context: cwd,
    entry: ['react-hot-loader/patch', path_1.default.resolve(cwd, entry)],
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
        new dotenv_webpack_1.default({
            path: dotenvPath,
            defaults: true,
            silent: true,
        }),
        new html_webpack_plugin_1.default({ template: 'index.html' }),
        new fork_ts_checker_webpack_plugin_1.default(),
        new monaco_editor_webpack_plugin_1.default({
            filename: 'js/[name].worker.js',
        }),
    ],
};
module.exports = configuration;
