import { InputRule, textblockTypeInputRule } from 'prosemirror-inputrules'
import { NodeSpec, NodeType } from 'prosemirror-model'
import Node from './Node'

export default class Heading extends Node {
  get name(): string {
    return 'heading'
  }

  get schema(): NodeSpec {
    return {
      attrs: { level: { default: 1 } },
      content: 'text*',
      group: 'block',
      defining: true,
      parseDOM: [
        { tag: 'h1', attrs: { level: 1 } },
        { tag: 'h2', attrs: { level: 2 } },
        { tag: 'h3', attrs: { level: 3 } },
        { tag: 'h4', attrs: { level: 4 } },
        { tag: 'h5', attrs: { level: 5 } },
        { tag: 'h6', attrs: { level: 6 } },
      ],
      toDOM: node => ['h' + node.attrs.level, 0],
    }
  }

  inputRules({ type }: { type: NodeType }): InputRule[] {
    return [
      textblockTypeInputRule(/^(#{1,6})\s$/, type, match => ({
        level: match[1]!.length,
      })),
    ]
  }
}
