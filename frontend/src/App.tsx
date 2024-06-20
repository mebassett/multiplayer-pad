import './App.css'
import Editor, { monaco } from '@monaco-editor/react'
import { AutomergeUrl } from '@automerge/automerge-repo'
import { useDocument } from '@automerge/automerge-repo-react-hooks'
import { MyDoc } from "./types.ts"


function App({ url } : { url: AutomergeUrl} ) {
  const [doc, changeDoc] = useDocument<MyDoc>(url) 

  function onMonacoChange(newValue: string, e: monaco.IModelContentChangedEvent): void {
    changeDoc((d: any) => { d.count = (d.count || 0) + 1})
    console.log(e.changes)
  }

  return (
    <>
        <h1>Hello, world!</h1>

        <p> 
          Count: <strong>{doc?.count ?? 0 }</strong>
        </p>
        <Editor height="90vh"
                width="80vw" 
                onChange={onMonacoChange}
                defaultLanguage="javascript" 
                defaultValue="// multiplayer pad" />

    </>
  )
}

export default App
