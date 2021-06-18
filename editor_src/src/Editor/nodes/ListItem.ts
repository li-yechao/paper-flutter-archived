import { Keymap } from 'prosemirror-commands'
import { NodeSpec, NodeType } from 'prosemirror-model'
import { splitListItem } from 'prosemirror-schema-list'
import Node from './Node'

export default class ListItem extends Node {
  get name(): string {
    return 'list_item'
  }

  get schema(): NodeSpec {
    return {
      content: 'paragraph block*',
      defining: true,
      draggable: true,
      parseDOM: [{ tag: 'li' }],
      toDOM: () => ['li', 0],
    }
  }

  keymap({ type }: { type: NodeType }): Keymap {
    return {
      Enter: splitListItem(type),
    }
  }
}
