#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const app_build_1 = require("./commands/app-build");
const app_serve_1 = require("./commands/app-serve");
commander_1.program.name('angela');
commander_1.program
    .command('serve <entry>')
    .description('Start app for development')
    .option('--host [host]', 'Listening address', 'localhost')
    .option('-p, --port [port]', 'Listening port', '8080')
    .option('--env-path [dot env file]', 'Dotenv file path')
    .option('--public-path [path]', 'Public path', '/')
    .action((entry, options) => {
    app_serve_1.runAppServe({
        entry,
        host: options.host,
        port: options.port,
        envPath: options.envPath,
        publicPath: options.publicPath,
    });
});
commander_1.program
    .command('build <entry>')
    .description('Bundle app for production')
    .option('--env-path [dot env file]', 'Dotenv file path')
    .option('--public-path [path]', 'Public path', '/')
    .option('-o --output-path [path]', 'Output path', 'dist/')
    .option('--compress', 'Compress output files use gzip')
    .option('--analyze', 'Open bundle analyzer')
    .action((entry, options) => {
    app_build_1.runAppBuild({
        entry,
        envPath: options.envPath,
        publicPath: options.publicPath,
        outputPath: options.outputPath,
        compress: options.compress,
        analyze: options.analyze,
    });
});
commander_1.program.parse(process.argv);
