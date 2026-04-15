import type { Session } from '@synonymdev/pubky'
import { getPubky, keypairFromMnemonic, getPublicKey } from './pubky'
import { Keypair } from '@synonymdev/pubky'

const LOCAL_KEY = 'switchboard_pubky_credentials'

interface PersistedCredentials {
  pubkyId: string
  method: 'mnemonic' | 'authflow'
  mnemonic?: string
  secret?: string
}

let cachedSession: Session | null = null
let cachedPubkyId: string | null = null

function persist(data: PersistedCredentials) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  } catch {
    // localStorage unavailable
  }
}

function load(): PersistedCredentials | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedCredentials
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

async function restoreFromCredentials(data: PersistedCredentials): Promise<{ session: Session; pubkyId: string } | null> {
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
    return null
  }
}

export async function getSession(): Promise<{ session: Session; pubkyId: string } | null> {
  if (cachedSession && cachedPubkyId) {
    return { session: cachedSession, pubkyId: cachedPubkyId }
  }

  const data = load()
  if (!data) return null

  if (data.method === 'mnemonic' || data.mnemonic || data.secret) {
    return restoreFromCredentials(data)
  }

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
    localStorage.removeItem(LOCAL_KEY)
  } catch {
    // localStorage unavailable
  }
}
