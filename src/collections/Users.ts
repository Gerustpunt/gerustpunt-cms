import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    // Bootstrap: when no users exist yet, allow anyone to create the first
    // admin via /admin/create-first-user. Once at least one user exists,
    // only authenticated users can create more.
    create: async ({ req }) => {
      if (req.user) return true
      const count = await req.payload.count({ collection: 'users', overrideAccess: true })
      return count.totalDocs === 0
    },
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
    admin: ({ req }) => !!req.user,
  },
  fields: [
    // Email + password added by default via auth: true
  ],
}
