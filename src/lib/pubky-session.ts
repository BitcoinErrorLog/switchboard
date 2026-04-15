import type { Session } from '@synonymdev/pubky'
import { getPubky, keypairFromMnemonic, getPublicKey } from './pubky'
import { Keypair } from '@synonymdev/pubky'

const SESSION_KEY = 'switchboard_pubky_session'

interface PersistedSession {
  pubkyId: string
  method: 'mnemonic' | 'authflow'
  mnemonic?: string
  secret?: string
}

let cachedSession: Session | null = null
let cachedPubkyId: string | null = null

function persist(data: PersistedSession) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {
    // sessionStorage unavailable
  }
}

function load(): PersistedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedSession
  } catch {
    return null
  }
}

export function persistMnemonicSession(mnemonic: string, pubkyId: string) {
  persist({ pubkyId, method: 'mnemonic', mnemonic })
}

export function persistSecretSession(secret: Uint8Array, pubkyId: string) {
  const hex = Array.from(secret).map((b) => b.toString(16).padStart(2, '0')).join('')
  persist({ pubkyId, method: 'mnemonic', secret: hex })
}

export function persistAuthFlowSession(session: Session, pubkyId: string) {
  cachedSession = session
  cachedPubkyId = pubkyId
  persist({ pubkyId, method: 'authflow' })
}

export function setCachedSession(session: Session, pubkyId: string) {
  cachedSession = session
  cachedPubkyId = pubkyId
}

export async function getSession(): Promise<{ session: Session; pubkyId: string } | null> {
  if (cachedSession && cachedPubkyId) {
    return { session: cachedSession, pubkyId: cachedPubkyId }
  }

  const data = load()
  if (!data) return null

  if (data.method === 'mnemonic') {
    try {
      let keypair: ReturnType<typeof Keypair.fromSecret>

      if (data.mnemonic) {
        const result = keypairFromMnemonic(data.mnemonic)
        keypair = result.keypair
      } else if (data.secret) {
        const bytes = new Uint8Array(
          data.secret.match(/.{2}/g)!.map((b) => parseInt(b, 16)),
        )
        keypair = Keypair.fromSecret(bytes)
      } else {
        return null
      }

      const pubky = getPubky()
      const signer = pubky.signer(keypair)
      const session = await signer.signin()
      const pubkyId = getPublicKey(session)

      cachedSession = session
      cachedPubkyId = pubkyId
      return { session, pubkyId }
    } catch {
      clearSession()
      return null
    }
  }

  // authflow sessions can't be restored from storage — need the in-memory cache
  return null
}

export function hasPersisted(): boolean {
  return load() !== null || (cachedSession !== null && cachedPubkyId !== null)
}

export function getPersistedPubkyId(): string | null {
  if (cachedPubkyId) return cachedPubkyId
  const data = load()
  return data?.pubkyId ?? null
}

export function clearSession() {
  cachedSession = null
  cachedPubkyId = null
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // sessionStorage unavailable
  }
}
