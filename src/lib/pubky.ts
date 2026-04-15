import { Pubky, Keypair, PublicKey, AuthFlowKind } from '@synonymdev/pubky'
import type { Session, AuthFlow, Capabilities } from '@synonymdev/pubky'
import * as bip39 from 'bip39'

export { AuthFlowKind }
export type { AuthFlow }

let pubkyInstance: Pubky | null = null

export function getPubky(): Pubky {
  if (!pubkyInstance) {
    pubkyInstance = new Pubky()
  }
  return pubkyInstance
}

export interface GeneratedKeypair {
  keypair: Keypair
  mnemonic: string
  pubkyId: string
}

export function generateKeypair(): GeneratedKeypair {
  const mnemonic = bip39.generateMnemonic(256)
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const secret = seed.subarray(0, 32)
  const keypair = Keypair.fromSecret(secret)
  const pubkyId = keypair.publicKey.z32()
  return { keypair, mnemonic, pubkyId }
}

export function keypairFromMnemonic(mnemonic: string): { keypair: Keypair; pubkyId: string } {
  const seed = bip39.mnemonicToSeedSync(mnemonic)
  const secret = seed.subarray(0, 32)
  const keypair = Keypair.fromSecret(secret)
  const pubkyId = keypair.publicKey.z32()
  return { keypair, pubkyId }
}

export async function signup(
  keypair: Keypair,
  homeserverPubky: string,
  signupCode: string,
): Promise<Session> {
  const pubky = getPubky()
  const signer = pubky.signer(keypair)
  const homeserverPk = PublicKey.from(homeserverPubky)
  return signer.signup(homeserverPk, signupCode)
}

export async function writeJson(
  session: Session,
  path: `/pub/${string}`,
  data: any,
): Promise<void> {
  await session.storage.putJson(path, data)
}

export function getPublicKey(session: Session): string {
  return session.info.publicKey.z32()
}

const SWITCHBOARD_CAPABILITIES: Capabilities = '/pub/pubky.app/:rw'

export function startSigninFlow(): AuthFlow {
  const pubky = getPubky()
  const kind = AuthFlowKind.signin()
  return pubky.startAuthFlow(SWITCHBOARD_CAPABILITIES, kind)
}

export async function signinWithAuthFlow(): Promise<{
  session: Session
  pubkyId: string
  authorizationUrl: string
  awaitApproval: () => Promise<{ session: Session; pubkyId: string }>
}> {
  const flow = startSigninFlow()
  const authorizationUrl = flow.authorizationUrl

  return {
    session: null as unknown as Session,
    pubkyId: '',
    authorizationUrl,
    awaitApproval: async () => {
      const session = await flow.awaitApproval()
      const pubkyId = getPublicKey(session)
      return { session, pubkyId }
    },
  }
}
