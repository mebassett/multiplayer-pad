import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Repo, isValidAutomergeUrl} from "@automerge/automerge-repo"
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import { RepoContext } from "@automerge/automerge-repo-react-hooks"
import { next as A } from "@automerge/automerge"

import { MyDoc } from "./types.ts"

const repo = new Repo({ network: [new BrowserWebSocketClientAdapter("ws://localhost:3030")]
                      , storage: new IndexedDBStorageAdapter("qawolf-multiplayer-pad")
                      })



const rootDocUrl = `${document.location.hash.substring(1)}`

console.log(new Text());
const handle = isValidAutomergeUrl(rootDocUrl) 
             ? repo.find(rootDocUrl) 
             : repo.create<MyDoc>(A.from({ text: "// start multiplayer editing" }))
const docUrl = (document.location.hash = handle.url)



ReactDOM.createRoot(document.getElementById('root')!).render(
<RepoContext.Provider value={repo}>
  <React.StrictMode>
    <App url={docUrl} />
  </React.StrictMode>
  </RepoContext.Provider>,
)
