"use strict";
module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                modules: false,
                useBuiltIns: 'usage',
                corejs: 3,
                targets: {
                    node: true,
                    browsers: '> 0.25%, not dead',
                },
            },
        ],
        '@babel/preset-react',
        [
            '@babel/preset-typescript',
            {
                allowNamespaces: true,
            },
        ],
    ],
    plugins: [
        'react-hot-loader/babel',
        '@babel/plugin-proposal-optional-chaining',
        '@babel/plugin-proposal-nullish-coalescing-operator',
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        '@babel/plugin-proposal-class-properties',
        [
            '@emotion',
            {
                labelFormat: '[dirname]-[filename]-[local]',
            },
        ],
    ],
};
