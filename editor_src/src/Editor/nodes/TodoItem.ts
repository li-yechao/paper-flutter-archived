import { Keymap } from 'prosemirror-commands'
import { NodeSpec, NodeType } from 'prosemirror-model'
import { splitListItem } from 'prosemirror-schema-list'
import { EditorView } from 'prosemirror-view'
import Node from './Node'

export default class TodoItem extends Node {
  constructor(private editor: { readonly view?: EditorView; readonly todoItemReadOnly?: boolean }) {
    super()
  }

  get name(): string {
    return 'todo_item'
  }

  get schema(): NodeSpec {
    return {
      attrs: { checked: { default: false } },
      content: 'paragraph block*',
      defining: true,
      parseDOM: [
        {
          tag: 'li[data-type="todo_item"]',
          getAttrs: dom => ({
            checked: (dom as HTMLElement).getAttribute('data-checked') === 'true',
          }),
        },
      ],
      toDOM: node => {
        const input = document.createElement('input')
        input.type = 'checkbox'
        input.disabled = !!this.editor.todoItemReadOnly
        input.addEventListener('change', this.toggleChecked)

        if (node.attrs.checked) {
          input.checked = true
        }

        return [
          'li',
          {
            'data-type': 'todo_item',
            'data-checked': node.attrs.checked ? 'true' : 'false',
          },
          [
            'span',
            {
              contentEditable: 'false',
            },
            input,
          ],
          ['div', 0],
        ]
      },
    }
  }

  keymap({ type }: { type: NodeType }): Keymap {
    return {
      Enter: splitListItem(type),
    }
  }

  toggleChecked = (event: Event) => {
    const target = event.target as HTMLInputElement
    const { view } = this.editor
    if (!target || !view) {
      return
    }
    const { tr } = view.state
    const { top, left } = target.getBoundingClientRect()
    const result = view.posAtCoords({ top, left })

    if (result) {
      const transaction = tr.setNodeMarkup(result.inside, undefined, {
        checked: target.checked,
      })
      view.dispatch(transaction)
    }
  }
}
