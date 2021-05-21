import { NodeSpec } from 'prosemirror-model'
import Node from './Node'

export default class Title extends Node {
  get name(): string {
    return 'title'
  }

  get schema(): NodeSpec {
    return {
      content: 'text*',
      defining: true,
      parseDOM: [{ tag: 'h1.title' }],
      toDOM: () => ['h1', { class: 'title' }, 0],
    }
  }
}
