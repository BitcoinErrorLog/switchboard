import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useActivationStore, type MergeStrategy } from '@/stores/activation'
import { useVerificationStore } from '@/stores/verification'
import { useImportStore } from '@/stores/import'
import { generateKeypair, keypairFromMnemonic, signup, writeJson } from '@/lib/pubky'
import { mapIdentityToUser, mapObjectToPost, mapEdgeToFollow, mapTagToTag } from '@/core/mapper'
import { lookupPubkyId, registerLink } from '@/lib/identity-links'
import ActivationProgress from '@/components/ActivationProgress'
import PubkyAuth from '@/components/PubkyAuth'
import { persistMnemonicSession, persistAuthFlowSession, setCachedSession } from '@/lib/pubky-session'
import type { Session } from '@synonymdev/pubky'
import type { SwitchboardIdentity, SwitchboardObject, SwitchboardEdge } from '@/core/types'

export default function Activate() {
  const { platform } = useParams<{ platform: string }>()
  const navigate = useNavigate()
  const activation = useActivationStore()
  const verification = useVerificationStore()
  const importStore = useImportStore()

  const hasVerifiedIdentity =
    importStore.identity && importStore.identity.verification_state === 'verified'

  const canActivateNew =
    verification.signupCode &&
    verification.homeserverPubky &&
    hasVerifiedIdentity

  if (activation.step === 'complete') {
    navigate(`/${platform}/done`)
    return null
  }

  if (!hasVerifiedIdentity) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">
            You must verify ownership of this account before activating.
          </p>
          <Link
            to={`/${platform}/import`}
            className="mt-4 inline-block text-pubky-light hover:underline"
          >
            Verify ownership
          </Link>
        </div>
      </div>
    )
  }

  if (!activation.mode) {
    return <ModeChooser platform={platform!} />
  }

  if (activation.mode === 'existing') {
    return (
      <ExistingAccountFlow
        platform={platform!}
        identity={importStore.identity!}
        objects={importStore.objects}
        edges={importStore.edges}
      />
    )
  }

  return (
    <NewAccountFlow
      platform={platform!}
      canActivate={!!canActivateNew}
      identity={importStore.identity!}
      objects={importStore.objects}
      edges={importStore.edges}
    />
  )
}

function ModeChooser({ platform }: { platform: string }) {
  const activation = useActivationStore()

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link
          to={`/${platform}/preview`}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back to preview
        </Link>

        <h2 className="mt-6 text-2xl font-bold text-zinc-100">
          Activate Your Pubky
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Choose how to set up your Pubky account with the imported data.
        </p>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => activation.setMode('new')}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-left transition-all hover:border-pubky hover:bg-zinc-800/80"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🆕</span>
              <div>
                <p className="font-semibold text-zinc-100">
                  Create a New Pubky
                </p>
                <p className="text-sm text-zinc-400">
                  Generate a new keypair, verify via Homegate, and import all
                  data into a brand new account
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => activation.setMode('existing')}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-left transition-all hover:border-pubky hover:bg-zinc-800/80"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🔗</span>
              <div>
                <p className="font-semibold text-zinc-100">
                  Link to Existing Pubky
                </p>
                <p className="text-sm text-zinc-400">
                  Sign in with Pubky Ring and merge imported data into your
                  existing account
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

interface FlowProps {
  platform: string
  identity: SwitchboardIdentity
  objects: SwitchboardObject[]
  edges: SwitchboardEdge[]
}

function ExistingAccountFlow({ platform, identity, objects, edges }: FlowProps) {
  const activation = useActivationStore()

  const handleAuthenticated = (session: Session, pubkyId: string) => {
    activation.setExistingSession(session, pubkyId)
    activation.setStep('choosing_merge')

    persistAuthFlowSession(session, pubkyId)
    registerLink(identity.platform, identity.external_id, pubkyId)
  }

  const handleAuthError = (error: string) => {
    activation.setError(error)
  }

  const handleSelectMerge = async (strategy: MergeStrategy) => {
    activation.setMergeStrategy(strategy)
    const { session, pubkyId } = useActivationStore.getState()

    if (!session || !pubkyId) {
      activation.setError('Session lost — please authenticate again')
      return
    }

    if (strategy === 'link_only') {
      activation.setStep('complete')
      return
    }

    await writeImportedData(session, pubkyId, strategy, identity, objects, edges)
  }

  const showAuth = activation.step === 'idle' || activation.step === 'authenticating'
  const showMerge = activation.step === 'choosing_merge'
  const showProgress = [
    'writing_profile',
    'writing_follows',
    'writing_posts',
    'writing_tags',
  ].includes(activation.step)

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <button
          onClick={() => activation.reset()}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Choose a different option
        </button>

        <h2 className="mt-6 text-2xl font-bold text-zinc-100">
          Link Existing Pubky
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Sign in with Pubky Ring to merge your imported data.
        </p>

        <div className="mt-8">
          {showAuth && (
            <PubkyAuth
              onAuthenticated={handleAuthenticated}
              onError={handleAuthError}
            />
          )}

          {showMerge && <MergeStrategyPicker onSelect={handleSelectMerge} />}

          {showProgress && <ActivationProgress />}

          {activation.step === 'error' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error">
                {activation.error}
              </div>
              <button
                onClick={() => activation.reset()}
                className="w-full rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:border-zinc-600"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MergeStrategyPicker({
  onSelect,
}: {
  onSelect: (strategy: MergeStrategy) => void
}) {
  const strategies: Array<{
    key: MergeStrategy
    title: string
    description: string
    icon: string
  }> = [
    {
      key: 'full',
      title: 'Full Merge',
      description:
        'Overwrite your Pubky profile with the imported one and import all posts, follows, and tags',
      icon: '📥',
    },
    {
      key: 'additive',
      title: 'Additive Only',
      description:
        'Import posts, follows, and tags but keep your existing Pubky profile unchanged',
      icon: '➕',
    },
    {
      key: 'link_only',
      title: 'Link Only',
      description:
        'Just connect the accounts for ongoing reader, composer, and sync — no historical import',
      icon: '🔗',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-success/30 bg-success/5 p-4">
        <p className="text-sm font-medium text-success">
          ✓ Authenticated — choose what to import
        </p>
      </div>

      <div className="space-y-3">
        {strategies.map((s) => (
          <button
            key={s.key}
            onClick={() => onSelect(s.key)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-5 text-left transition-all hover:border-pubky hover:bg-zinc-800/80"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="font-semibold text-zinc-100">{s.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{s.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function NewAccountFlow({
  platform,
  canActivate,
  identity,
  objects,
  edges,
}: FlowProps & { canActivate: boolean }) {
  const activation = useActivationStore()
  const verification = useVerificationStore()

  if (!canActivate) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400">Complete verification first.</p>
          <Link
            to={`/${platform}/verify`}
            className="mt-4 inline-block text-pubky-light hover:underline"
          >
            Go to verification
          </Link>
        </div>
      </div>
    )
  }

  const handleStartActivation = async () => {
    activation.setStep('generating_keypair')
    const { mnemonic, pubkyId } = generateKeypair()
    activation.setKeypair(mnemonic, pubkyId)

    registerLink(identity.platform, identity.external_id, pubkyId)

    activation.setStep('backup_mnemonic')
  }

  const handleConfirmMnemonic = async () => {
    if (
      !activation.mnemonic ||
      !activation.pubkyId ||
      !verification.signupCode ||
      !verification.homeserverPubky
    )
      return

    const { keypair, pubkyId } = keypairFromMnemonic(activation.mnemonic)

    activation.setStep('signing_up')
    let session: Session
    try {
      session = await signup(
        keypair,
        verification.homeserverPubky!,
        verification.signupCode!,
      )
      activation.setSession(session)
      persistMnemonicSession(activation.mnemonic, pubkyId)
      setCachedSession(session, pubkyId)
    } catch (err) {
      activation.setError(
        err instanceof Error ? err.message : 'Signup failed',
      )
      return
    }

    await writeImportedData(session, pubkyId, 'full', identity, objects, edges)
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <button
          onClick={() => activation.reset()}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Choose a different option
        </button>

        <h2 className="mt-6 text-2xl font-bold text-zinc-100">
          Create New Pubky
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Create your Pubky account and import all your data.
        </p>

        <div className="mt-8">
          {activation.step === 'idle' && (
            <button
              onClick={handleStartActivation}
              className="w-full rounded-xl bg-pubky px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-pubky-dark"
            >
              Create My Pubky Account
            </button>
          )}

          {activation.step === 'generating_keypair' && (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-pubky border-t-transparent" />
              <span className="ml-3 text-sm text-zinc-400">
                Generating keypair...
              </span>
            </div>
          )}

          {(activation.step === 'backup_mnemonic' ||
            (activation.step === 'generating_keypair' &&
              activation.mnemonic)) && (
            <MnemonicBackup
              mnemonic={activation.mnemonic!}
              onConfirm={handleConfirmMnemonic}
            />
          )}

          {[
            'signing_up',
            'writing_profile',
            'writing_follows',
            'writing_posts',
            'writing_tags',
          ].includes(activation.step) && <ActivationProgress />}

          {activation.step === 'error' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error">
                {activation.error}
              </div>
              <button
                onClick={() => activation.reset()}
                className="w-full rounded-lg border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:border-zinc-600"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

async function writeImportedData(
  session: Session,
  pubkyId: string,
  strategy: MergeStrategy,
  identity: SwitchboardIdentity,
  objects: SwitchboardObject[],
  edges: SwitchboardEdge[],
) {
  const activation = useActivationStore.getState()

  if (strategy !== 'additive') {
    activation.setStep('writing_profile')
    try {
      const mapped = mapIdentityToUser(identity, pubkyId)
      await writeJson(session, mapped.path as `/pub/${string}`, mapped.json)
      activation.setProfileWritten()
    } catch (err) {
      activation.setError(
        err instanceof Error ? err.message : 'Profile write failed',
      )
      return
    }
  } else {
    activation.setProfileWritten()
  }

  const followEdges = edges.filter((e) => e.edge_kind === 'follows')
  const writableFollows = followEdges.filter(
    (e) => lookupPubkyId(e.platform, e.target_ref) !== null,
  )
  activation.setTotals(writableFollows.length, objects.length, 0)
  activation.setStep('writing_follows')

  for (const edge of writableFollows) {
    const followeePubkyId = lookupPubkyId(edge.platform, edge.target_ref)
    if (!followeePubkyId) continue
    try {
      const mapped = mapEdgeToFollow(edge, pubkyId, followeePubkyId)
      await writeJson(session, mapped.path as `/pub/${string}`, mapped.json)
      activation.incrementFollows()
    } catch {
      // Skip individual follow write failures
    }
  }

  activation.setStep('writing_posts')
  const postUris: Array<{ postUrl: string; tags: string[] }> = []

  for (const object of objects) {
    try {
      const mapped = mapObjectToPost(object, pubkyId)
      if (!mapped) continue
      await writeJson(session, mapped.path as `/pub/${string}`, mapped.json)
      activation.incrementPosts()
      if (object.tags.length > 0) {
        postUris.push({ postUrl: mapped.url, tags: object.tags })
      }
    } catch {
      // Skip individual post write failures
    }
  }

  activation.setStep('writing_tags')
  let totalTagCount = 0
  for (const entry of postUris) {
    totalTagCount += entry.tags.length
  }
  activation.setTotals(writableFollows.length, objects.length, totalTagCount)

  for (const entry of postUris) {
    for (const tag of entry.tags) {
      try {
        const mapped = mapTagToTag(tag, entry.postUrl, pubkyId)
        if (!mapped) continue
        await writeJson(session, mapped.path as `/pub/${string}`, mapped.json)
        activation.incrementTags()
      } catch {
        // Skip individual tag write failures
      }
    }
  }

  activation.setStep('complete')
}

function MnemonicBackup({
  mnemonic,
  onConfirm,
}: {
  mnemonic: string
  onConfirm: () => void
}) {
  const [confirmed, setConfirmed] = useState(false)
  const words = mnemonic.split(' ')

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-6">
        <h3 className="text-base font-semibold text-warning">
          Recovery Phrase
        </h3>
        <p className="mt-2 text-sm text-zinc-400">
          Write down these 24 words and store them safely. This is the only way
          to recover your Pubky account.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {words.map((word, i) => (
            <div key={i} className="rounded-lg bg-zinc-800 px-3 py-2 text-sm">
              <span className="text-zinc-500 mr-1.5">{i + 1}.</span>
              <span className="text-zinc-100 font-mono">{word}</span>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-pubky focus:ring-pubky"
        />
        <span className="text-sm text-zinc-300">
          I have written down my recovery phrase and stored it safely.
        </span>
      </label>

      <button
        onClick={onConfirm}
        disabled={!confirmed}
        className="w-full rounded-xl bg-pubky px-6 py-4 font-semibold text-white transition-colors hover:bg-pubky-dark disabled:opacity-50"
      >
        Continue — Create Account
      </button>
    </div>
  )
}
