import { NodeSpec } from 'prosemirror-model'
import { Plugin, PluginKey } from 'prosemirror-state'
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
    const key = new PluginKey(this.name)

    return [
      new Plugin({
        key,
        view: () => ({
          update: view => {
            const { state } = view
            const insertNodeAtEnd = key.getState(state)

            if (!insertNodeAtEnd) {
              return
            }

            const { doc, schema, tr } = state
            const type = schema.nodes[this.name]
            const transaction = tr.insert(doc.content.size, type.create())
            view.dispatch(transaction)
          },
        }),
        state: {
          init: (_, state) => {
            const lastNode = state.tr.doc.lastChild
            return lastNode?.type.name !== this.name
          },
          apply: (tr, value) => {
            if (!tr.docChanged) {
              return value
            }

            const lastNode = tr.doc.lastChild
            return lastNode?.type.name !== this.name
          },
        },
      }),
    ]
  }
}
