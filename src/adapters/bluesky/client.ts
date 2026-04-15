import { Agent, CredentialSession } from '@atproto/api'
import type { BlueskyCredentials } from './types'

const BSKY_SERVICE = 'https://bsky.social'

let session: CredentialSession | null = null
let agent: Agent | null = null

export function getAgent(): Agent | null {
  return agent
}

export function hasSession(): boolean {
  return agent !== null && session !== null
}

export async function login(credentials: BlueskyCredentials): Promise<Agent> {
  session = new CredentialSession(new URL(BSKY_SERVICE))
  await session.login({
    identifier: credentials.identifier,
    password: credentials.password,
  })
  agent = new Agent(session)
  return agent
}

export function logout(): void {
  session = null
  agent = null
}

export async function resumeSession(stored: {
  accessJwt: string
  refreshJwt: string
  handle: string
  did: string
}): Promise<Agent> {
  session = new CredentialSession(new URL(BSKY_SERVICE))
  await session.resumeSession({
    accessJwt: stored.accessJwt,
    refreshJwt: stored.refreshJwt,
    handle: stored.handle,
    did: stored.did,
    active: true,
  })
  agent = new Agent(session)
  return agent
}

export function getSessionData(): {
  accessJwt: string
  refreshJwt: string
  handle: string
  did: string
} | null {
  if (!session?.session) return null
  return {
    accessJwt: session.session.accessJwt,
    refreshJwt: session.session.refreshJwt,
    handle: session.session.handle,
    did: session.session.did,
  }
}
