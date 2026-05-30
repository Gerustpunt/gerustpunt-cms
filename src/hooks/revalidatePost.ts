import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

type Doc = { slug?: string }

const FRONTEND_URL = 'https://gerustpunt.nl'

/**
 * Pings the frontend's `/api/revalidate` route so Next.js evicts the cached
 * tag for this post and the listing. Runs on publish + delete.
 *
 * The endpoint is authenticated via `PREVIEW_SECRET` — both apps need the
 * same secret in their env. Failure to revalidate is logged but never
 * blocks the CMS save.
 */
async function ping(slug?: string) {
  const secret = process.env.PREVIEW_SECRET
  if (!secret) return

  const params = new URLSearchParams({ secret })
  if (slug) params.set('slug', slug)

  try {
    await fetch(`${FRONTEND_URL}/api/revalidate?${params.toString()}`, {
      method: 'POST',
      // Don't hold up the request; the CMS doesn't need a response body.
      keepalive: true,
    })
  } catch (err) {
    console.warn('[revalidatePost] frontend revalidation failed', err)
  }
}

export const revalidatePost: CollectionAfterChangeHook = async ({ doc, previousDoc }) => {
  const d = doc as Doc
  const prev = previousDoc as Doc | undefined
  await ping(d.slug)
  if (prev?.slug && prev.slug !== d.slug) {
    await ping(prev.slug)
  }
  return doc
}

export const revalidatePostAfterDelete: CollectionAfterDeleteHook = async ({ doc }) => {
  const d = doc as Doc
  await ping(d.slug)
  return doc
}
