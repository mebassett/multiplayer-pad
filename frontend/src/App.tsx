import './App.css'
import Editor from '@monaco-editor/react'
import { type editor } from 'monaco-editor';
import { AutomergeUrl } from '@automerge/automerge-repo'
import { useRepo, useHandle, useLocalAwareness, useRemoteAwareness, useDocument } from '@automerge/automerge-repo-react-hooks'
import { MyDoc, EditorState } from "./types.ts"
import { next as A } from "@automerge/automerge"
import {useRef} from 'react'


function App({ userId, url } : { userId: string, url: AutomergeUrl} ) {
  const changeDoc = useDocument<MyDoc>(url)[1]

  const repo = useRepo()

  const handle = useHandle<MyDoc>(url) || repo.create()

  const editorRef = useRef(null as null | editor.IStandaloneCodeEditor)

  const [localState, updateLocalState] = useLocalAwareness(
      { handle
      , userId
      , initialState: { cursorPosition: {lineNumber: 1, column:1 }}
      })


  const [peerStates, _] = useRemoteAwareness({ handle, localUserId: userId})

  function handleEditorDidMount(_editor : editor.IStandaloneCodeEditor) {
      editorRef.current = _editor
      _editor.onKeyDown(() => {
          updateLocalState((s: EditorState) => ({...s, cursorPosition: _editor.getPosition() }))
      })
      _editor.onMouseDown(() => {
          updateLocalState((s: EditorState) => ({...s, cursorPosition: _editor.getPosition() }))
      })
  }


  function onMonacoChange(newValue: string | undefined) : void { //, e: Monaco.IModelContentChangedEvent): void {


    changeDoc((d: MyDoc) => {
        A.updateText(d, ["text"], newValue || "")
    })
  }

  handle.update( d => {
    if(editorRef.current) {
      editorRef.current.executeEdits('', [{
          range: editorRef.current.getModel()!.getFullModelRange()
        , text: d.text
        , forceMoveMarkers: false
      }])
      
    }
    return d;
  })

  return (
    <>
        <h1>Hello, world!</h1>

        <p> 
          Num peers: <strong>{Object.keys(peerStates).length ?? 0 }</strong>, Last Cursor Position: (line <strong>{localState.cursorPosition.lineNumber}</strong>, column: <strong>{localState.cursorPosition.column}</strong>)
        </p>
        <Editor height="90vh"
                width="80vw" 
                onChange={onMonacoChange}
                onMount={handleEditorDidMount}
                defaultLanguage="javascript" 

                defaultValue="// multiplayer pad" />

    </>
  )
}

export default App
