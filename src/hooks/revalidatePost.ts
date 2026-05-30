import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

type Doc = { slug?: string }

const FRONTEND_URL = 'https://gerustpunt.nl'

// Shared secret with the frontend's /api/preview + /api/revalidate routes.
// Hardcoded on both sides to avoid env-var drift across deploys. Rotate by
// updating it in both repos and redeploying both.
const PREVIEW_SECRET = 'e9c6df35d9c267c9df50bd5425cd47eb0774b0019d3c65e1'

/**
 * Pings the frontend's `/api/revalidate` route so Next.js evicts the cached
 * tag for this post and the listing. Runs on publish + delete. Failure to
 * revalidate is logged but never blocks the CMS save.
 */
async function ping(slug?: string) {
  const params = new URLSearchParams({ secret: PREVIEW_SECRET })
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
