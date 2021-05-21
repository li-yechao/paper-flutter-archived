import { NodeSpec } from 'prosemirror-model'
import Node from './Node'

export default class Doc extends Node {
  get name(): string {
    return 'doc'
  }

  get schema(): NodeSpec {
    return {
      content: 'title block+',
    }
  }
}
