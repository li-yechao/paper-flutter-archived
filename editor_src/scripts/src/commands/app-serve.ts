import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import portfinder from 'portfinder'

export function runAppServe(args: {
  entry: string
  host: string
  port: number
  envPath?: string
  publicPath: string
}) {
  let webpackBin = path.resolve(process.cwd(), 'node_modules/webpack/bin/webpack.js')
  if (!fs.existsSync(webpackBin)) {
    webpackBin = 'webpack'
  }

  portfinder.getPortPromise({ port: args.port }).then(port => {
    spawnSync(
      'node',
      [
        webpackBin,
        'serve',
        '--config',
        path.resolve(__dirname, '../config/webpack.config.app.serve.js'),
        '--hot',
        '--host',
        args.host,
        '--port',
        port.toString(),
        '--history-api-fallback',
        '--disable-host-check',
        '--output-public-path',
        args.publicPath,
      ],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          __WEBPACK_ENTRY__: args.entry,
          __DOTENV_PATH__: args.envPath,
        },
      }
    )
  })
}
