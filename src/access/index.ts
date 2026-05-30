import type { Access } from 'payload'

/** Anyone (no auth required). Used for public REST endpoints. */
export const anyone: Access = () => true

/** Only signed-in admin users. */
export const authenticated: Access = ({ req }) => Boolean(req.user)

/** Public can read published posts; signed-in users see drafts too. */
export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) return true
  return {
    _status: { equals: 'published' },
  }
}
