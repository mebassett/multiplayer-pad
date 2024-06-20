// following https://github.com/automerge/automerge-repo/blob/main/examples/sync-server/index.js
//
import fs from "fs"
import express from "express"
import { WebSocketServer } from "ws"
import { Repo, PeerId } from "@automerge/automerge-repo"
import { NodeWSServerAdapter } from "@automerge/automerge-repo-network-websocket"
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs"
import os from "os"

export class Server {
  /** @type WebSocketServer */
  #socket

  /** @type ReturnType<import("express").Express["listen"]> */
  #server

  /** @type {((value: any) => void)[]} */
  #readyResolvers : ((value: any) => void)[]  = []

  #isReady = false


  constructor() {
    const dir = "automerge-sync-server-data"
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    var hostname = os.hostname()

    this.#socket = new WebSocketServer({ noServer: true })

    const PORT = 3030

    const app = express()
    app.use(express.static("public"))

    const config = {
      network: [new NodeWSServerAdapter(this.#socket)],
      storage: new NodeFSStorageAdapter(dir),
      /** @ts-ignore @type {(import("@automerge/automerge-repo").PeerId)}  */
      peerId: `storage-server-${hostname}` as PeerId,
      // Since this is a server, we don't share generously — meaning we only sync documents they already
      // know about and can ask for by ID.
      sharePolicy: async () => false,
    }
    new Repo(config)

    app.get("/", (_, res) => {
      res.send(`giddyup, server is running! `)
    })

    this.#server = app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`)
      this.#isReady = true
      this.#readyResolvers.forEach((resolve) => resolve(true))
    })

    this.#server.on("upgrade", (request, socket, head) => {
      this.#socket.handleUpgrade(request, socket, head, (socket) => {
        this.#socket.emit("connection", socket, request)
      })
    })
  }

  async ready() {
    if (this.#isReady) {
      return true
    }

    return new Promise((resolve) => {
      this.#readyResolvers.push(resolve)
    })
  }

  close() {
    this.#socket.close()
    this.#server.close()
  }
}

new Server()
