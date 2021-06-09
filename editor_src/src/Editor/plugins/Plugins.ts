import { Plugin } from 'prosemirror-state'
import Extension from '../lib/Extension'

export default class Plugins extends Extension {
  constructor(private _plugins: Plugin[]) {
    super()
  }

  get name(): string {
    return 'plugins'
  }

  get plugins(): Plugin[] {
    return this._plugins
  }
}
