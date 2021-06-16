import { NodeSpec } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import Node from './Node'

export default class Paragraph extends Node {
  get name(): string {
    return 'paragraph'
  }

  get schema(): NodeSpec {
    return {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM: () => ['p', 0],
    }
  }

  get plugins() {
    return [
      new Plugin({
        appendTransaction: (_trs, _oldState, newState) => {
          if (newState.doc.lastChild?.type.name !== this.name) {
            const type = newState.schema.nodes[this.name]
            return newState.tr.insert(newState.doc.content.size, type.create())
          }
          return
        },
      }),
    ]
  }
}
