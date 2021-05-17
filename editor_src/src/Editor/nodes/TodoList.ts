import { InputRule, wrappingInputRule } from 'prosemirror-inputrules'
import { NodeSpec, NodeType } from 'prosemirror-model'
import Node from './Node'

export default class TodoList extends Node {
  get name(): string {
    return 'todo_list'
  }

  get schema(): NodeSpec {
    return {
      content: 'todo_item+',
      group: 'block',
      parseDOM: [{ tag: 'ul[data-type="todo_list"]' }],
      toDOM: () => ['ul', { 'data-type': 'todo_list' }, 0],
    }
  }

  inputRules({ type }: { type: NodeType }): InputRule[] {
    return [wrappingInputRule(/^(\[\s?\])\s$/i, type)]
  }
}
