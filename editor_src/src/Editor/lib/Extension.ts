import { Plugin } from 'prosemirror-state'

export type ExtensionType = 'extension' | 'node' | 'mark'

export default abstract class Extension {
  get type(): ExtensionType {
    return 'extension'
  }

  get plugins(): Plugin[] {
    return []
  }

  abstract get name(): string
}
