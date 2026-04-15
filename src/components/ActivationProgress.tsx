import { useActivationStore, type ActivationStep } from '@/stores/activation'

const STEP_LABELS: Record<ActivationStep, string> = {
  idle: 'Ready',
  generating_keypair: 'Generating keypair…',
  backup_mnemonic: 'Back up your recovery phrase',
  signing_up: 'Creating Pubky account…',
  writing_profile: 'Writing profile…',
  writing_follows: 'Writing follows…',
  writing_posts: 'Writing posts…',
  writing_tags: 'Writing tags…',
  complete: 'Complete!',
  error: 'Error',
}

function isActiveOrPast(current: ActivationStep, target: ActivationStep): boolean {
  const order: ActivationStep[] = [
    'idle',
    'generating_keypair',
    'backup_mnemonic',
    'signing_up',
    'writing_profile',
    'writing_follows',
    'writing_posts',
    'writing_tags',
    'complete',
  ]
  return order.indexOf(current) >= order.indexOf(target)
}

export default function ActivationProgress() {
  const { step, profileWritten, followsWritten, totalFollows, postsWritten, totalPosts, tagsWritten, totalTags } = useActivationStore()

  const writeSteps: Array<{
    key: ActivationStep
    label: string
    progress?: string
  }> = [
    { key: 'generating_keypair', label: 'Generate keypair' },
    { key: 'backup_mnemonic', label: 'Backup recovery phrase' },
    { key: 'signing_up', label: 'Create account' },
    { key: 'writing_profile', label: 'Write profile', progress: profileWritten ? '✓' : undefined },
    {
      key: 'writing_follows',
      label: 'Write follows',
      progress: totalFollows > 0 ? `${followsWritten}/${totalFollows}` : undefined,
    },
    {
      key: 'writing_posts',
      label: 'Write posts',
      progress: totalPosts > 0 ? `${postsWritten}/${totalPosts}` : undefined,
    },
    {
      key: 'writing_tags',
      label: 'Write tags',
      progress: totalTags > 0 ? `${tagsWritten}/${totalTags}` : undefined,
    },
  ]

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-300 mb-3">{STEP_LABELS[step]}</p>
      <div className="space-y-1.5">
        {writeSteps.map((ws) => {
          const isActive = step === ws.key
          const isPast = isActiveOrPast(step, ws.key) && step !== ws.key
          return (
            <div
              key={ws.key}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                isActive
                  ? 'bg-pubky/10 border border-pubky/30 text-pubky-light'
                  : isPast
                    ? 'text-zinc-400'
                    : 'text-zinc-600'
              }`}
            >
              <div className="flex items-center gap-2">
                {isPast ? (
                  <span className="text-success">✓</span>
                ) : isActive ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-pubky border-t-transparent" />
                ) : (
                  <span className="text-zinc-600">○</span>
                )}
                <span>{ws.label}</span>
              </div>
              {ws.progress && (
                <span className="text-xs text-zinc-500">{ws.progress}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
