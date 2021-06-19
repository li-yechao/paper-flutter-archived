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
        { tag: 'h1', attrs: { level: 1 }, contentElement: 'span' },
        { tag: 'h2', attrs: { level: 2 }, contentElement: 'span' },
        { tag: 'h3', attrs: { level: 3 }, contentElement: 'span' },
        { tag: 'h4', attrs: { level: 4 }, contentElement: 'span' },
        { tag: 'h5', attrs: { level: 5 }, contentElement: 'span' },
        { tag: 'h6', attrs: { level: 6 }, contentElement: 'span' },
      ],
      toDOM: node => ['h' + node.attrs.level, ['span', 0]],
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
