import { InputRule, wrappingInputRule } from 'prosemirror-inputrules'
import { NodeSpec, NodeType } from 'prosemirror-model'
import Node from './Node'

export default class OrderedList extends Node {
  get name(): string {
    return 'ordered_list'
  }

  get schema(): NodeSpec {
    return {
      content: 'list_item+',
      group: 'block',
      parseDOM: [{ tag: 'ol' }],
      toDOM: () => ['ol', 0],
    }
  }

  inputRules({ type }: { type: NodeType }): InputRule[] {
    return [wrappingInputRule(/^(\d+)\.\s$/, type)]
  }
}
