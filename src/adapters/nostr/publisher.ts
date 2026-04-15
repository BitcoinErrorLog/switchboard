import { publishEvent } from './client'
import { signEvent, canSign } from './signer'

export async function publishAnnouncement(
  content: string,
  writeRelays?: string[],
): Promise<{ success: boolean; eventId: string | null }> {
  if (!canSign()) {
    return { success: false, eventId: null }
  }

  const template = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [] as string[][],
    content,
  }

  let signed
  try {
    signed = await signEvent(template)
  } catch {
    return { success: false, eventId: null }
  }

  try {
    await publishEvent(signed as any, writeRelays)
    return { success: true, eventId: signed.id }
  } catch {
    return { success: false, eventId: null }
  }
}

export async function publishReply(
  content: string,
  replyToEventId: string,
  replyToAuthorPubkey: string,
  rootEventId?: string,
  writeRelays?: string[],
): Promise<{ success: boolean; eventId: string | null }> {
  if (!canSign()) {
    return { success: false, eventId: null }
  }

  const tags: string[][] = []

  if (rootEventId && rootEventId !== replyToEventId) {
    tags.push(['e', rootEventId, '', 'root'])
    tags.push(['e', replyToEventId, '', 'reply'])
  } else {
    tags.push(['e', replyToEventId, '', 'root'])
  }
  tags.push(['p', replyToAuthorPubkey])

  const template = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content,
  }

  let signed
  try {
    signed = await signEvent(template)
  } catch {
    return { success: false, eventId: null }
  }

  try {
    await publishEvent(signed as any, writeRelays)
    return { success: true, eventId: signed.id }
  } catch {
    return { success: false, eventId: null }
  }
}
