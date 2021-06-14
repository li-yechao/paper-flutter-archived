import fs from 'fs'
import { spawnSync } from 'child_process'
import path from 'path'

export function runAppBuild(args: {
  entry: string
  envPath?: string
  publicPath: string
  outputPath: string
  compress?: boolean
  analyze?: boolean
}) {
  let webpackBin = path.resolve(process.cwd(), 'node_modules/webpack/bin/webpack.js')
  if (!fs.existsSync(webpackBin)) {
    webpackBin = 'webpack'
  }

  spawnSync(
    'node',
    [
      webpackBin,
      'build',
      '--config',
      path.resolve(__dirname, '../config/webpack.config.app.build.js'),
      '--output-public-path',
      args.publicPath,
      '--output-path',
      args.outputPath,
    ],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        __WEBPACK_ENTRY__: args.entry,
        __DOTENV_PATH__: args.envPath,
        __ENABLE_WEBPACK_BUNDLE_ANALYZER__: args.analyze ? '1' : undefined,
        __ENABLE_WEBPACK_COMPRESSION__: args.compress ? '1' : undefined,
      },
    }
  )
}
