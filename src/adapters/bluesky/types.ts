export interface BlueskySession {
  handle: string
  did: string
  accessJwt: string
  refreshJwt: string
}

export interface BlueskyCredentials {
  identifier: string
  password: string
}
