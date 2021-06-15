import { Keymap } from 'prosemirror-commands'
import { NodeSpec, NodeType } from 'prosemirror-model'
import { splitListItem } from 'prosemirror-schema-list'
import Node, { NodeViewCreator } from './Node'

export default class TodoItem extends Node {
  constructor(private options: { readonly todoItemReadOnly?: boolean } = {}) {
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
        return [
          'li',
          {
            'data-type': 'todo_item',
            'data-checked': node.attrs.checked ? 'true' : 'false',
          },
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

  get nodeView(): NodeViewCreator {
    return ({ node, view, getPos }) => {
      const listItem = document.createElement('li')

      const checkboxWrapper = document.createElement('span')
      checkboxWrapper.contentEditable = 'false'

      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      if (this.options.todoItemReadOnly) {
        checkbox.disabled = true
      }
      checkbox.addEventListener('change', () => {
        if (typeof getPos === 'function') {
          const { checked } = checkbox
          view.dispatch(view.state.tr.setNodeMarkup(getPos(), undefined, { checked }))
        }
      })

      const content = document.createElement('div')

      if (node.attrs.checked) {
        checkbox.checked = true
      }

      checkboxWrapper.append(checkbox)
      listItem.append(checkboxWrapper, content)

      return {
        dom: listItem,
        contentDOM: content,
        update: updatedNode => {
          if (updatedNode.type !== node.type) {
            return false
          }

          checkbox.checked = !!updatedNode.attrs.checked
          return true
        },
      }
    }
  }
}
