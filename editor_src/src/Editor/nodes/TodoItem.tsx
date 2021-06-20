import { css } from '@emotion/css'
import styled from '@emotion/styled'
import { Checkbox } from '@material-ui/core'
import { Keymap } from 'prosemirror-commands'
import { NodeSpec, NodeType } from 'prosemirror-model'
import { splitListItem } from 'prosemirror-schema-list'
import React from 'react'
import Node, { createReactNodeViewCreator, NodeViewCreator } from './Node'

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
      draggable: true,
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
    return createReactNodeViewCreator(
      ({
        checked,
        disabled,
        onChange,
      }: {
        checked: boolean
        disabled: boolean
        onChange: (checked: boolean) => void
      }) => {
        return (
          <_Checkbox
            checked={checked}
            disabled={disabled}
            onChange={(e, checked) => {
              e.target.focus()
              onChange(checked)
            }}
          />
        )
      },
      ({ node, view, getPos }) => {
        return {
          checked: node.attrs.checked,
          disabled: this.options.todoItemReadOnly ?? true,
          onChange: checked => {
            view.dispatch(
              view.state.tr.setNodeMarkup(getPos(), undefined, { ...node.attrs, checked })
            )
          },
        }
      },
      {
        createDom: () => {
          const dom = document.createElement('li')
          const reactDOM = document.createElement('span')
          reactDOM.contentEditable = 'false'
          const contentDOM = document.createElement('div')
          dom.classList.add(css`
            position: relative;
            list-style: none;
          `)
          reactDOM.classList.add(css`
            position: absolute;
            left: -32px;
            top: 0;
          `)

          return { dom, reactDOM, contentDOM }
        },
        stopEvent: () => false,
        ignoreMutation: () => true,
      }
    )
  }
}

const _Checkbox = styled(Checkbox)`
  color: inherit !important;
  padding: 0;
  vertical-align: text-bottom;
`
