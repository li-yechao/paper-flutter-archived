#!/usr/bin/env node

import { program } from 'commander'
import { runAppBuild } from './commands/app-build'
import { runAppServe } from './commands/app-serve'

program.name('angela')

program
  .command('serve <entry>')
  .description('Start app for development')
  .option('--host [host]', 'Listening address', 'localhost')
  .option('-p, --port [port]', 'Listening port', '8080')
  .option('--env-path [dot env file]', 'Dotenv file path')
  .option('--public-path [path]', 'Public path', '/')
  .action((entry, options) => {
    runAppServe({
      entry,
      host: options.host,
      port: options.port,
      envPath: options.envPath,
      publicPath: options.publicPath,
    })
  })

program
  .command('build <entry>')
  .description('Bundle app for production')
  .option('--env-path [dot env file]', 'Dotenv file path')
  .option('--public-path [path]', 'Public path', '/')
  .option('-o --output-path [path]', 'Output path', 'dist/')
  .option('--compress', 'Compress output files use gzip')
  .option('--analyze', 'Open bundle analyzer')
  .action((entry, options) => {
    runAppBuild({
      entry,
      envPath: options.envPath,
      publicPath: options.publicPath,
      outputPath: options.outputPath,
      compress: options.compress,
      analyze: options.analyze,
    })
  })

program.parse(process.argv)
