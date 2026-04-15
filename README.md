# Switchboard

Bridge your identity, graph, and content from any network into Pubky.

## Architecture

Four layers:

1. **Canonical Model** — stable types shared across all platforms (`SwitchboardIdentity`, `SwitchboardObject`, `SwitchboardEdge`, `SwitchboardSignal`, `SwitchboardCollection`, `SwitchboardCheckpoint`)
2. **Adapter Layer** — platform-specific auth, fetch, parse, publish (`BridgeAdapter` interface)
3. **Pipeline Layer** — jobs, queues, retries, dedupe (post-alpha)
4. **Product Layer** — UI surfaces: import, preview, verification, activation

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS 4
- Zustand (state)
- `@synonymdev/pubky` (WASM SDK)
- `pubky-app-specs` (WASM data models)
- `nostr-tools` (Nostr protocol)
- `bip39` (key derivation)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Adding a New Platform

1. Implement the adapter in `src/adapters/<platform>/` (must implement `BridgeAdapter`)
2. Build `Identify<Platform>.tsx` and `Announce<Platform>.tsx` in `src/components/<platform>/`
3. Register the config in `src/platforms.ts`

No changes needed to shared pages, stores, mapper, or SDK integration.

## Route Structure

```
/                     Home (platform picker)
/:platform            Landing (platform-specific copy)
/:platform/import     Import (identify + fetch)
/:platform/preview    Preview (profile, graph, content, tags)
/:platform/verify     Verify (SMS or Lightning via Homegate)
/:platform/activate   Activate (keypair gen, signup, data writes)
/:platform/done       Done (announce back, profile link)
```

## Environment

Copy `.env.example` to `.env` and set:

- `VITE_HOMEGATE_URL` — Homegate verification service URL
