import { Node as ProsemirrorNode } from 'prosemirror-model'
import { Plugin } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { notEmpty } from '../../utils/array'
import Extension from '../lib/Extension'

export interface DropPasteFileOptions {
  fileToNode: (view: EditorView, file: File) => ProsemirrorNode | undefined | void
}

export default class DropPasteFile extends Extension {
  constructor(private options: DropPasteFileOptions) {
    super()
  }

  get name(): string {
    return 'drop_file'
  }

  get plugins(): Plugin[] {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            paste: (view, event) => {
              const files = event.clipboardData?.files
              if (!files?.length) {
                return false
              }

              const nodes = Array.from(files)
                .map(file => this.options.fileToNode(view, file))
                .filter(notEmpty)
              if (nodes.length === 0) {
                return false
              }

              const { from, to } = view.state.selection
              view.dispatch(view.state.tr.replaceWith(from, to, nodes))

              event.preventDefault()
              return true
            },
            drop: (view, event) => {
              const files = event.dataTransfer?.files
              if (!files?.length) {
                return false
              }

              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
              if (!pos) {
                return false
              }

              const nodes = Array.from(files)
                .map(file => this.options.fileToNode(view, file))
                .filter(notEmpty)
              if (nodes.length === 0) {
                return false
              }

              view.dispatch(view.state.tr.replaceWith(pos.pos, pos.pos, nodes))

              event.preventDefault()
              return true
            },
          },
        },
      }),
    ]
  }
}
