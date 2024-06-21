import './App.css'
import Editor from '@monaco-editor/react'
import { type editor } from 'monaco-editor';
import { AutomergeUrl } from '@automerge/automerge-repo'
import { useRepo, useHandle, useLocalAwareness, useRemoteAwareness, useDocument } from '@automerge/automerge-repo-react-hooks'
import { MyDoc, EditorState } from "./types.ts"
import { next as A } from "@automerge/automerge"
import {useRef} from 'react'


function App({ userId, url } : { userId: string, url: AutomergeUrl} ) {
  const [doc, changeDoc] = useDocument<MyDoc>(url) 

  const repo = useRepo()

  const handle = useHandle<EditorState>(url) || repo.create()

  const editorRef = useRef(null as null | editor.IStandaloneCodeEditor)

  const [localState, updateLocalState] = useLocalAwareness(
      { handle
      , userId
      , initialState: { cursorPosition: {lineNumber: 1, column:1 }}
      })

  console.log(localState)


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
      // editorRef.current.setPosition(localState.cursorPosition)
      console.log("set cursor position?", localState.cursorPosition)
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
                value={doc?.text || "// multiplayer pad"}
                onMount={handleEditorDidMount}
                defaultLanguage="javascript" 

                defaultValue="// multiplayer pad" />

    </>
  )
}

export default App
