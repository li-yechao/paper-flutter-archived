import { NodeSpec } from 'prosemirror-model'
import Node from './Node'

export default class Text extends Node {
  get name(): string {
    return 'text'
  }

  get schema(): NodeSpec {
    return {
      group: 'inline',
    }
  }
}
