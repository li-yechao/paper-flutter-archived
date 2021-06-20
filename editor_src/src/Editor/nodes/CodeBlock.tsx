import styled from '@emotion/styled'
import { InputRule, textblockTypeInputRule } from 'prosemirror-inputrules'
import { Node as ProsemirrorNode, NodeSpec, NodeType, Slice } from 'prosemirror-model'
import { Plugin, Transaction } from 'prosemirror-state'
import { ReplaceStep } from 'prosemirror-transform'
import React from 'react'
import { v4 } from 'uuid'
import CupertinoActivityIndicator from '../../components/CupertinoActivityIndicator'
import Node, { createReactNodeViewCreator, lazyReactNodeView, NodeViewCreator } from './Node'

type MonacoInstance = import('../../components/MonacoEditor').MonacoInstance

export default class CodeBlock extends Node {
  constructor(public options: { clientID?: string | number } = {}) {
    super()
  }

  get name(): string {
    return 'code_block'
  }

  get schema(): NodeSpec {
    return {
      attrs: { editorId: { default: null }, language: { default: null } },
      content: 'text*',
      group: 'block',
      code: true,
      defining: true,
      isolating: true,
      atom: true,
      parseDOM: [
        {
          tag: 'pre',
          preserveWhitespace: 'full',
          getAttrs: node => ({
            language: (node as HTMLElement).getAttribute('data-language') || null,
          }),
        },
      ],
      toDOM: node => {
        return [
          'pre',
          node.attrs.language ? { 'data-language': node.attrs.language } : {},
          ['code', 0],
        ]
      },
    }
  }

  private isCodeBlock(doc: ProsemirrorNode, from: number, to: number) {
    let res: { node: ProsemirrorNode; pos: number } | undefined
    doc.nodesBetween(from, to, (node, pos) => {
      if (node.type.name === this.name) {
        if (from > pos && to < pos + node.nodeSize) {
          res = { node, pos }
        }
        return false
      }
      return
    })
    return res
  }

  private _monacoEditorInstances = new Map<string, MonacoInstance>()
  private _checkEditorIdAttr(node: ProsemirrorNode): string {
    const { editorId } = node.attrs
    if (!editorId) {
      throw new Error(`Invalid editorId ${editorId}`)
    }
    return editorId
  }
  private getMonacoEditorInstanceByNode(node: ProsemirrorNode): MonacoInstance | undefined {
    return this._monacoEditorInstances.get(this._checkEditorIdAttr(node))
  }
  private setMonacoEditorInstanceByNode(node: ProsemirrorNode, instance: MonacoInstance) {
    return this._monacoEditorInstances.set(this._checkEditorIdAttr(node), instance)
  }
  private deleteMonacoEditorInstanceByNode(node: ProsemirrorNode) {
    return this._monacoEditorInstances.delete(this._checkEditorIdAttr(node))
  }

  get plugins(): Plugin[] {
    return [
      new Plugin({
        appendTransaction: (trs, prevState, nextState) => {
          // Ensure every CodeBlock node have a editorId attribute
          {
            let tr: Transaction | undefined
            nextState.doc.descendants((node, pos) => {
              if (node.type.name === this.name && !node.attrs.editorId) {
                if (!tr) {
                  tr = nextState.tr
                }
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, editorId: v4() })
                return false
              }
              return true
            })
            if (tr) {
              return tr
            }
          }

          for (const tr of trs) {
            for (const step of tr.steps) {
              if (step instanceof ReplaceStep) {
                const from: number = (step as any).from
                const to: number = (step as any).to
                const codeBlock = this.isCodeBlock(prevState.doc, from, to)
                if (codeBlock) {
                  const slice: Slice = (step as any).slice
                  const { firstChild } = slice.content

                  if (
                    slice.content.childCount === 0 ||
                    (slice.content.childCount === 1 && firstChild?.isText)
                  ) {
                    const contentManager = this.getMonacoEditorInstanceByNode(codeBlock.node)
                      ?.contentManager

                    if (contentManager) {
                      const codePos = codeBlock.pos + 1
                      const index = from - codePos
                      const length = Math.abs(to - codePos - index)
                      if (firstChild?.text) {
                        if (length === 0) {
                          contentManager.insert(index, firstChild.text)
                        } else {
                          contentManager.replace(index, length, firstChild.text)
                        }
                      } else if (length > 0) {
                        contentManager.delete(index, length)
                      }
                    }
                  }
                }
              }
            }
          }

          return
        },
      }),
    ]
  }

  inputRules({ type }: { type: NodeType }): InputRule[] {
    return [
      textblockTypeInputRule(/^```([a-z]+)?\s$/, type, match => ({
        language: match[1],
      })),
    ]
  }

  get nodeView(): NodeViewCreator {
    return createReactNodeViewCreator(
      lazyReactNodeView(
        React.lazy(() => import('../../components/MonacoEditor')),
        <_FallbackContainer>
          <CupertinoActivityIndicator />
        </_FallbackContainer>
      ),
      ({ node, view, getPos, selected }) => ({
        defaultValue: node.textContent,
        language: node.attrs.language,
        readOnly: !view.editable,
        focused: selected,
        clientID: this.options.clientID,
        onInited: e => this.setMonacoEditorInstanceByNode(node, e),
        onDestroyed: () => this.deleteMonacoEditorInstanceByNode(node),
        onInsert: (index: number, text: string) => {
          const pos = getPos() + 1
          view.dispatch(view.state.tr.insertText(text, pos + index))
        },
        onReplace: (index: number, length: number, text: string) => {
          const pos = getPos() + 1
          view.dispatch(view.state.tr.insertText(text, pos + index, pos + index + length))
        },
        onDelete: (index: number, length: number) => {
          const pos = getPos() + 1
          view.dispatch(view.state.tr.delete(pos + index, pos + index + length))
        },
        onLanguageChange: (language: string) => {
          view.dispatch(
            view.state.tr.setNodeMarkup(getPos(), undefined, {
              ...node.attrs,
              language,
            })
          )
        },
      }),
      {
        stopEvent: () => true,
        ignoreMutation: () => true,
      }
    )
  }
}

const _FallbackContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  margin: 16px 0;
  border-radius: 8px;
  padding: 8px 0;
  background-color: #fffffe;
  border: 1px solid #aeaeae;

  @media (prefers-color-scheme: dark) {
    background-color: #1e1e1e;
    border: 1px solid transparent;
  }
`
