import './App.css'
import Editor from '@monaco-editor/react'
import { AutomergeUrl } from '@automerge/automerge-repo'
import { useDocument } from '@automerge/automerge-repo-react-hooks'
import { MyDoc } from "./types.ts"


function App({ url } : { url: AutomergeUrl} ) {
  const [doc, changeDoc] = useDocument<MyDoc>(url) 


  return (
    <>
        <h1>Hello, world!</h1>
        <button 
          onClick={ () => {
              console.log("clicked...")
              changeDoc((d: any) => {
                  d.count = (d.count || 0) +1
              })
          }}>

          Count: {doc?.count ?? 0 }
        </button>
        <Editor height="90vh" width="80vw" defaultLanguage="javascript" defaultValue="// multiplayer pad" />

    </>
  )
}

export default App
