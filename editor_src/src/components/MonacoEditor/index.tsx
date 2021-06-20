import { EditorContentManager } from '@convergencelabs/monaco-collab-ext'
import styled from '@emotion/styled'
import { Select } from '@material-ui/core'
import { editor } from 'monaco-editor'
import React, { useRef, useEffect, useCallback } from 'react'
import { useMountedState, useUpdate } from 'react-use'

export type MonacoInstance = {
  editor: editor.ICodeEditor
  contentManager: EditorContentManager
}

const MonacoEditor = ({
  defaultValue,
  language,
  readOnly,
  focused,
  clientID,
  onInited,
  onDestroyed,
  onInsert,
  onReplace,
  onDelete,
  onLanguageChange,
}: {
  defaultValue?: string
  language?: string
  readOnly?: boolean
  focused?: boolean
  clientID?: string | number
  onInited?: (e: MonacoInstance) => void
  onDestroyed?: () => void
  onInsert?: (index: number, text: string) => void
  onReplace?: (index: number, length: number, text: string) => void
  onDelete?: (index: number, length: number) => void
  onLanguageChange?: (language: string) => void
}) => {
  const _isMounted = useMountedState()
  const _update = useUpdate()
  const update = useCallback(() => _isMounted() && _update(), [])

  const container = useRef<HTMLDivElement>(null)
  const monacoEditor = useRef<editor.ICodeEditor>()
  const contentManager = useRef<EditorContentManager>()

  useEffect(() => {
    if (!container.current) {
      return
    }

    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)')
    const getTheme = (e: { matches: boolean }) => (e.matches ? 'vs-dark' : 'vs')
    const theme = getTheme(matchMedia)
    const themeListener = (e: MediaQueryListEvent) => {
      editor.setTheme(getTheme(e))
    }
    matchMedia.addEventListener('change', themeListener)

    monacoEditor.current = editor.create(container.current, {
      value: defaultValue,
      language,
      theme,
      automaticLayout: true,
      minimap: {
        enabled: false,
      },
      scrollbar: {
        verticalScrollbarSize: 0,
        horizontalScrollbarSize: 6,
        alwaysConsumeMouseWheel: false,
      },
      renderWhitespace: 'all',
      readOnly,
      scrollBeyondLastLine: false,
    })
    contentManager.current = new EditorContentManager({
      editor: monacoEditor.current,
      remoteSourceId: clientID?.toString(),
      onInsert,
      onReplace,
      onDelete,
    })

    const updateHeight = () => {
      const _editor = monacoEditor.current
      const _container = container.current
      if (_editor && _container) {
        const contentHeight = _editor.getContentHeight()
        _editor.getDomNode()!.style.height = `${contentHeight}px`
        _editor.layout({ width: _container.clientWidth, height: contentHeight })
      }
    }
    monacoEditor.current.onDidContentSizeChange(updateHeight)
    updateHeight()

    update()

    onInited?.({ editor: monacoEditor.current, contentManager: contentManager.current })

    return () => {
      matchMedia.removeEventListener('change', themeListener)
      onDestroyed?.()
      contentManager.current?.dispose()
      monacoEditor.current?.dispose()
    }
  }, [])

  useEffect(() => {
    const e = monacoEditor.current
    if (e) {
      const hasFocus = e.hasWidgetFocus()
      if (focused && !hasFocus) {
        e.focus()
      } else if (!focused && hasFocus && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }
  }, [focused, monacoEditor.current])

  useEffect(() => {
    monacoEditor.current?.updateOptions({ readOnly })
  }, [readOnly])

  useEffect(() => {
    const model = monacoEditor.current?.getModel()
    model && editor.setModelLanguage(model, language || 'plaintext')
  }, [language])

  const handleLanguageChange = useCallback((e: React.ChangeEvent<{ value: any }>) => {
    onLanguageChange?.(e.target.value)
  }, [])

  const handleLanguageMouseUp = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])

  return (
    <_RootContainer>
      <_Select
        native
        variant="outlined"
        value={language}
        disabled={readOnly}
        onChange={handleLanguageChange}
        onMouseUp={handleLanguageMouseUp}
      >
        {LANGUAGES.map(lang => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </_Select>
      <div ref={container} />
    </_RootContainer>
  )
}

export default MonacoEditor

const _RootContainer = styled.div`
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

const _Select = styled(Select)`
  margin-left: 8px;
  margin-bottom: 8px;
  height: 32px;
  color: inherit;

  select {
    height: 100%;
    padding-top: 0;
    padding-bottom: 0;
  }

  .MuiSelect-icon {
    color: inherit;
  }

  .MuiOutlinedInput-notchedOutline {
    color: inherit;
    border-color: currentColor !important;
    opacity: 0.5;
  }
`

const LANGUAGES = [
  'abap',
  'aes',
  'apex',
  'azcli',
  'bat',
  'c',
  'cameligo',
  'clojure',
  'coffeescript',
  'cpp',
  'csharp',
  'csp',
  'css',
  'dart',
  'dockerfile',
  'ecl',
  'fsharp',
  'go',
  'graphql',
  'handlebars',
  'hcl',
  'html',
  'ini',
  'java',
  'javascript',
  'json',
  'julia',
  'kotlin',
  'less',
  'lexon',
  'lua',
  'm3',
  'markdown',
  'mips',
  'msdax',
  'mysql',
  'objective-c',
  'pascal',
  'pascaligo',
  'perl',
  'pgsql',
  'php',
  'plaintext',
  'postiats',
  'powerquery',
  'powershell',
  'pug',
  'python',
  'r',
  'razor',
  'redis',
  'redshift',
  'restructuredtext',
  'ruby',
  'rust',
  'sb',
  'scala',
  'scheme',
  'scss',
  'shell',
  'sol',
  'sql',
  'st',
  'swift',
  'systemverilog',
  'tcl',
  'twig',
  'typescript',
  'vb',
  'verilog',
  'xml',
  'yaml',
]
