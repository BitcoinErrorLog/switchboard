interface TagSuggestionsProps {
  tagFrequencies: Map<string, number>
  maxDisplay?: number
}

export default function TagSuggestions({ tagFrequencies, maxDisplay = 15 }: TagSuggestionsProps) {
  if (tagFrequencies.size === 0) {
    return null
  }

  const sorted = [...tagFrequencies.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxDisplay)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="text-base font-semibold text-zinc-300">Your Tags</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Extracted from your posts — these will be imported as Pubky tags.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {sorted.map(([tag, count]) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full border border-pubky/20 bg-pubky/10 px-3 py-1 text-sm text-pubky-light"
          >
            #{tag}
            <span className="text-xs text-zinc-500">×{count}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
