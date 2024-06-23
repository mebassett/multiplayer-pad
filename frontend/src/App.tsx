import './App.css'
import Editor from '@monaco-editor/react'
import { Range, type editor } from 'monaco-editor';
import { DocHandleChangePayload, AutomergeUrl } from '@automerge/automerge-repo'
import { useRepo, useHandle, useLocalAwareness, useRemoteAwareness } from '@automerge/automerge-repo-react-hooks'
import { emptyText, MyDoc, EditorState } from "./types.ts"
import { next as A } from "@automerge/automerge"
import {useRef} from 'react'


function App({ userId, url } : { userId: string, url: AutomergeUrl} ) {

  const repo = useRepo()

  const handle = useHandle<MyDoc>(url) || repo.find(url)

  let docRef = useRef(handle.docSync() as MyDoc | undefined) //A.init<MyDoc>()

  const editorRef = useRef(null as null | editor.IStandaloneCodeEditor)

  const decorationsRef = useRef(null as null | editor.IEditorDecorationsCollection)

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

      handle.whenReady().then( () => {
        return handle.doc()

      }).then ( doc => {
        _editor.executeEdits('', [{
            range: _editor.getModel()!.getFullModelRange()
          , text: doc!.text
          , forceMoveMarkers: false
        }])
      })
  }


  function onMonacoChange(newValue: string | undefined) : void { //, e: Monaco.IModelContentChangedEvent): void {


    handle.change((d: MyDoc) => {
        A.updateText(d, ["text"], newValue || "")
    })
  }

  handle.on('ephemeral-message', () => {
    if(decorationsRef.current)
      decorationsRef.current.clear()
    if(!editorRef.current) return

    const decorations =
    // we could juse inspect the event rather than useRemoteAwareness but nah..
    // this does introduce a subtle bug where the cursor lags one step behind
    // but I'm running out of time to fix stuff like this.
      Object.keys(peerStates).map( (uid: string): editor.IModelDeltaDecoration => ({
         range: new Range( peerStates[uid].cursorPosition.lineNumber
                         , peerStates[uid].cursorPosition.column
                         , peerStates[uid].cursorPosition.lineNumber
                         , peerStates[uid].cursorPosition.column)
       , options: { hoverMessage: { value: uid }
                  , className: "fakeCursor"
                  }
       }))
    decorationsRef.current = editorRef.current.createDecorationsCollection(decorations)
  })

  handle.on('change', (e: DocHandleChangePayload<MyDoc>):void => {
    if(!docRef.current){
        docRef.current = e.doc
        return
    }
    if(editorRef.current) {
      const doc = e.patchInfo.before
      const newDoc = e.patchInfo.after
      if(newDoc.text !== doc.text && newDoc.text !== editorRef.current!.getModel()!.getValue()) {
        const edits = e.patches.map( (patch:any): editor.IIdentifiedSingleEditOperation | null => {
          if(patch.action === 'splice') {
            const { lineNumber: line, column: col } = editorRef.current!.getModel()!.getPositionAt(patch.path[1])
            return { range: new Range(line, col, line, col)
                   , text: patch.value
                   , forceMoveMarkers: true
                   }
          }else if (patch.action === 'del') {
            const { lineNumber: sLine, column: sCol } = editorRef.current!.getModel()!.getPositionAt(patch.path[1])
            const { lineNumber: eLine, column: eCol } = editorRef.current!.getModel()!.getPositionAt(patch.path[1] + (patch.length || 1))
            return { range: new Range(sLine, sCol, eLine, eCol)
                   , text: null
                   , forceMoveMarkers: true
                   }
          } else return null
        }).filter ( (a) : a is editor.IIdentifiedSingleEditOperation => !!a)
        editorRef.current!.executeEdits('automerge', edits)
      }
      docRef.current = newDoc
    }
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
                defaultLanguage="typescript" 

                defaultValue={docRef.current ? docRef.current.text : emptyText} />

    </>
  )
}

export default App
