import { Agent } from '@atproto/api'
import { login, getAgent, getSessionData } from './client'
import type { BlueskyCredentials } from './types'

const BSKY_SERVICE = 'https://bsky.social'

export async function resolveHandle(handle: string): Promise<string> {
  const tempAgent = new Agent(BSKY_SERVICE)
  const res = await tempAgent.resolveHandle({ handle })
  return res.data.did
}

export async function loginAndVerify(credentials: BlueskyCredentials): Promise<{
  agent: Agent
  did: string
  handle: string
}> {
  const agent = await login(credentials)
  const sessionData = getSessionData()
  if (!sessionData) throw new Error('Login succeeded but no session data')
  return {
    agent,
    did: sessionData.did,
    handle: sessionData.handle,
  }
}

export function getStoredSession(): {
  accessJwt: string
  refreshJwt: string
  handle: string
  did: string
} | null {
  return getSessionData()
}

export function isAuthenticated(): boolean {
  return getAgent() !== null
}
