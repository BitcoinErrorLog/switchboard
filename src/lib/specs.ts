import { PubkySpecsBuilder, PubkyAppPostKind, PubkyAppUserLink } from 'pubky-app-specs'

export { PubkySpecsBuilder, PubkyAppPostKind, PubkyAppUserLink }

export function createBuilder(pubkyId: string): PubkySpecsBuilder {
  return new PubkySpecsBuilder(pubkyId)
}
