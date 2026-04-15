import { RichText } from '@atproto/api'
import { getAgent } from './client'

export async function publishPost(
  text: string,
  replyTo?: { uri: string; cid: string },
): Promise<{ success: boolean; uri: string | null; cid: string | null }> {
  const agent = getAgent()
  if (!agent) return { success: false, uri: null, cid: null }

  const rt = new RichText({ text })
  await rt.detectFacets(agent)

  const record: Record<string, unknown> = {
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date().toISOString(),
  }

  if (replyTo) {
    record.reply = {
      root: { uri: replyTo.uri, cid: replyTo.cid },
      parent: { uri: replyTo.uri, cid: replyTo.cid },
    }
  }

  try {
    const res = await agent.post(record as any)
    return { success: true, uri: res.uri, cid: res.cid }
  } catch {
    return { success: false, uri: null, cid: null }
  }
}
