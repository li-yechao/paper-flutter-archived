import { InputRule, wrappingInputRule } from 'prosemirror-inputrules'
import { NodeSpec, NodeType } from 'prosemirror-model'
import Node from './Node'

export default class Blockquote extends Node {
  get name(): string {
    return 'blockquote'
  }

  get schema(): NodeSpec {
    return {
      content: 'block+',
      group: 'block',
      parseDOM: [{ tag: 'blockquote' }],
      toDOM: () => ['blockquote', 0],
    }
  }

  inputRules({ type }: { type: NodeType }): InputRule[] {
    return [wrappingInputRule(/^\s*>\s$/, type)]
  }
}
