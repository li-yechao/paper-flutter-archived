import EventEmitter from 'events'
import { Step } from 'prosemirror-transform'

export type DocJson = { [key: string]: any }
export type ClientID = string | number

export type MessageDataSend =
  | { type: 'paper'; data: { accessToken: string; userId: string; paperId: string } }
  | { type: 'transaction'; data: { version: number; steps: DocJson[]; clientID: ClientID } }

export type MessageDataRecv =
  | { type: 'paper'; data: { version: number; doc: DocJson } }
  | { type: 'transaction'; data: { version: number; steps: DocJson[]; clientIDs: ClientID[] } }

export type CollabClientOptions = {
  webSocketUri: string
  userId: string
  paperId: string
  accessToken: string
}

declare interface CollabClient {
  on(event: 'paper', listener: (e: { version: number; doc: DocJson }) => void): this
  on(
    event: 'transaction',
    listener: (e: { version: number; steps: DocJson[]; clientIDs: ClientID[] }) => void
  ): this
}

class CollabClient extends EventEmitter {
  constructor(private options: CollabClientOptions) {
    super()
    this.ws = new WebSocket(this.options.webSocketUri)
    this.ws.onopen = this.handleOpen
    this.ws.onmessage = this.handleMessage
    this.ws.onclose = this.handleClose
    this.ws.onerror = this.handleError
  }

  private ws: WebSocket

  private handleOpen = () => {
    this.paper()
  }

  private handleClose = () => {}

  private handleError = () => {}

  private handleMessage = (e: MessageEvent) => {
    const m: MessageDataRecv = JSON.parse(e.data)
    switch (m.type) {
      case 'paper': {
        const { version, doc } = m.data
        this.emit('paper', { version, doc })
        break
      }
      case 'transaction': {
        const { version, steps, clientIDs } = m.data
        this.emit('transaction', { version, steps, clientIDs })
        break
      }
    }
  }

  transaction(data: { version: number; steps: Step[]; clientID: string | number }) {
    this.send({
      type: 'transaction',
      data,
    })
  }

  private paper() {
    this.send({
      type: 'paper',
      data: {
        accessToken: this.options.accessToken,
        userId: this.options.userId,
        paperId: this.options.paperId,
      },
    })
  }

  private send(m: MessageDataSend) {
    this.ws.send(JSON.stringify(m))
  }
}

export default CollabClient
