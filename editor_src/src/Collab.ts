export type CollabOptions = {
  socketIoUri: string
  userId: string
  paperId: string
  accessToken: string
}

export type Version = number

export type DocJson = { [key: string]: any }

export type ClientID = string | number

export interface EmitEvents {
  transaction: (e: { version: Version; steps: DocJson[]; clientID: ClientID }) => void
}

export interface ListenEvents {
  paper: (e: { version: Version; doc: DocJson }) => void
  transaction: (e: { version: Version; steps: DocJson[]; clientIDs: ClientID[] }) => void
}
