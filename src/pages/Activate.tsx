import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useActivationStore } from '@/stores/activation'
import { useVerificationStore } from '@/stores/verification'
import { useImportStore } from '@/stores/import'
import { generateKeypair, keypairFromMnemonic, signup, writeJson } from '@/lib/pubky'
import { mapIdentityToUser, mapObjectToPost, mapEdgeToFollow, mapTagToTag } from '@/core/mapper'
import { lookupPubkyId, registerLink } from '@/lib/identity-links'
import ActivationProgress from '@/components/ActivationProgress'

export default function Activate() {
  const { platform } = useParams<{ platform: string }>()
  const navigate = useNavigate()
  const activation = useActivationStore()
  const verification = useVerificationStore()
  const importStore = useImportStore()

  const canActivate =
    verification.signupCode &&
    verification.homeserverPubky &&
    importStore.identity &&
    importStore.identity.verification_state === 'verified'

  useEffect(() => {
    if (activation.step === 'complete') {
      navigate(`/${platform}/done`)
    }
  }, [activation.step, platform, navigate])

  const handleStartActivation = async () => {
    if (!canActivate) return

    activation.setStep('generating_keypair')
    const { mnemonic, pubkyId } = generateKeypair()
    activation.setKeypair(mnemonic, pubkyId)

    registerLink(
      importStore.identity!.platform,
      importStore.identity!.external_id,
      pubkyId,
    )

    activation.setStep('backup_mnemonic')
  }

  const handleConfirmMnemonic = async () => {
    if (
      !activation.mnemonic ||
      !activation.pubkyId ||
      !verification.signupCode ||
      !verification.homeserverPubky ||
      !importStore.identity
    ) return

    const { keypair, pubkyId } = generateKeypairFromState()

    // Step 3: Sign up
    activation.setStep('signing_up')
    let session
    try {
      session = await signup(
        keypair,
        verification.homeserverPubky!,
        verification.signupCode!,
      )
      activation.setSession(session)
    } catch (err) {
      activation.setError(err instanceof Error ? err.message : 'Signup failed')
      return
    }

    // Step 4: Write profile
    activation.setStep('writing_profile')
    try {
      const mapped = mapIdentityToUser(importStore.identity!, pubkyId)
      await writeJson(session, mapped.path as `/pub/${string}`, mapped.json)
      activation.setProfileWritten()
    } catch (err) {
      activation.setError(err instanceof Error ? err.message : 'Profile write failed')
      return
    }

    // Step 5: Write follows
    const followEdges = importStore.edges.filter((e) => e.edge_kind === 'follows')
    const writableFollows = followEdges.filter(
      (e) => lookupPubkyId(e.platform, e.target_ref) !== null,
    )
    activation.setTotals(writableFollows.length, importStore.objects.length, 0)
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

    // Step 6: Write posts
    activation.setStep('writing_posts')
    const postUris: Array<{ postUrl: string; tags: string[] }> = []

    for (const object of importStore.objects) {
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

    // Step 7: Write tags
    activation.setStep('writing_tags')
    let totalTagCount = 0
    for (const entry of postUris) {
      totalTagCount += entry.tags.length
    }
    activation.setTotals(writableFollows.length, importStore.objects.length, totalTagCount)

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

  function generateKeypairFromState() {
    return keypairFromMnemonic(activation.mnemonic!)
  }

  if (!canActivate) {
    const needsOwnershipProof = importStore.identity && importStore.identity.verification_state !== 'verified'
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          {needsOwnershipProof ? (
            <>
              <p className="text-zinc-400">You must verify ownership of this account before creating a Pubky account with its data.</p>
              <Link to={`/${platform}/import`} className="mt-4 inline-block text-pubky-light hover:underline">
                Verify ownership
              </Link>
            </>
          ) : (
            <>
              <p className="text-zinc-400">Complete verification first.</p>
              <Link to={`/${platform}/verify`} className="mt-4 inline-block text-pubky-light hover:underline">
                Go to verification
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link
          to={`/${platform}/verify`}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back to verification
        </Link>

        <h2 className="mt-6 text-2xl font-bold text-zinc-100">Activate Your Pubky</h2>
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
              <span className="ml-3 text-sm text-zinc-400">Generating keypair...</span>
            </div>
          )}

          {(activation.step === 'backup_mnemonic' || (activation.step === 'generating_keypair' && activation.mnemonic)) && (
            <MnemonicBackup
              mnemonic={activation.mnemonic!}
              onConfirm={handleConfirmMnemonic}
            />
          )}

          {['signing_up', 'writing_profile', 'writing_follows', 'writing_posts', 'writing_tags'].includes(activation.step) && (
            <ActivationProgress />
          )}

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
        <h3 className="text-base font-semibold text-warning">Recovery Phrase</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Write down these 24 words and store them safely. This is the only way to recover your Pubky account.
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
