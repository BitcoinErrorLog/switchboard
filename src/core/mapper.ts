import {
  PubkySpecsBuilder,
  PubkyAppPostKind,
  PubkyAppUserLink,
} from 'pubky-app-specs'
import type {
  SwitchboardIdentity,
  SwitchboardObject,
  SwitchboardEdge,
} from './types'

const NAME_MIN = 3
const NAME_MAX = 50
const BIO_MAX = 160
const IMAGE_URL_MAX = 300
const LINKS_MAX = 5
const LINK_TITLE_MAX = 100
const LINK_URL_MAX = 300
const POST_SHORT_MAX = 2000

function sanitizeName(name: string | null): string {
  if (!name || name.trim().length === 0 || name === '[DELETED]') {
    return 'anonymous'
  }
  let sanitized = name.trim()
  if (sanitized.length < NAME_MIN) {
    sanitized = sanitized.padEnd(NAME_MIN, '_')
  }
  if (sanitized.length > NAME_MAX) {
    sanitized = sanitized.slice(0, NAME_MAX)
  }
  return sanitized
}

function sanitizeBio(bio: string | null): string | null {
  if (!bio) return null
  return bio.length > BIO_MAX ? bio.slice(0, BIO_MAX) : bio
}

function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null
  return url.length > IMAGE_URL_MAX ? null : url
}

function sanitizeLinks(links: string[]): PubkyAppUserLink[] {
  return links
    .slice(0, LINKS_MAX)
    .filter((url) => url.length <= LINK_URL_MAX)
    .map((url) => {
      const title = new URL(url).hostname.slice(0, LINK_TITLE_MAX)
      return new PubkyAppUserLink(title, url)
    })
}

export interface MappedProfile {
  json: any
  path: string
  url: string
}

export function mapIdentityToUser(
  identity: SwitchboardIdentity,
  pubkyId: string,
): MappedProfile {
  const builder = new PubkySpecsBuilder(pubkyId)
  const links = sanitizeLinks(identity.links)

  const result = builder.createUser(
    sanitizeName(identity.display_name),
    sanitizeBio(identity.bio),
    sanitizeImageUrl(identity.avatar_url),
    links.map((l) => ({ title: l.title, url: l.url })),
    null,
  )

  return {
    json: result.user.toJson(),
    path: result.meta.path,
    url: result.meta.url,
  }
}

export interface MappedPost {
  json: any
  path: string
  url: string
  id: string
}

export function mapObjectToPost(
  object: SwitchboardObject,
  pubkyId: string,
): MappedPost | null {
  let content = object.body
  if (content.length > POST_SHORT_MAX) {
    content = content.slice(0, POST_SHORT_MAX)
  }
  if (content.trim().length === 0) return null

  const builder = new PubkySpecsBuilder(pubkyId)

  const result = builder.createPost(
    content,
    PubkyAppPostKind.Short,
    null,
    null,
    null,
  )

  return {
    json: result.post.toJson(),
    path: result.meta.path,
    url: result.meta.url,
    id: result.meta.id,
  }
}

export interface MappedFollow {
  json: any
  path: string
  url: string
}

export function mapEdgeToFollow(
  _edge: SwitchboardEdge,
  followerPubkyId: string,
  followeePubkyId: string,
): MappedFollow {
  const builder = new PubkySpecsBuilder(followerPubkyId)
  const result = builder.createFollow(followeePubkyId)
  return {
    json: result.follow.toJson(),
    path: result.meta.path,
    url: result.meta.url,
  }
}

export interface MappedTag {
  json: any
  path: string
  url: string
}

export function mapTagToTag(
  label: string,
  postUri: string,
  pubkyId: string,
): MappedTag | null {
  const sanitized = label.replace(/^#+/, '').toLowerCase().trim().replace(/[\s,:]/g, '')
  if (sanitized.length < 1 || sanitized.length > 20) return null

  const builder = new PubkySpecsBuilder(pubkyId)
  const result = builder.createTag(postUri, sanitized)
  return {
    json: result.tag.toJson(),
    path: result.meta.path,
    url: result.meta.url,
  }
}
