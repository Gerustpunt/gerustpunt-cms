import type { CollectionConfig } from 'payload'
import { slugify } from '../utils/slug'
import { revalidatePost, revalidatePostAfterDelete } from '../hooks/revalidatePost'

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gerustpunt.nl'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Post', plural: 'Posts' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'publishedAt', 'updatedAt', '_status'],
    group: 'Blog',
    description:
      'Blog posts. Drafts autosave; click "Publish" to make them live on gerustpunt.nl.',
    livePreview: {
      url: ({ data }) =>
        `${FRONTEND_URL}/api/preview?secret=${process.env.PREVIEW_SECRET || ''}&slug=${(data as { slug?: string })?.slug || ''}`,
      breakpoints: [
        { name: 'mobile', label: 'Mobile', width: 375, height: 667 },
        { name: 'tablet', label: 'Tablet', width: 768, height: 1024 },
        { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
      ],
    },
    preview: (doc) =>
      `${FRONTEND_URL}/api/preview?secret=${process.env.PREVIEW_SECRET || ''}&slug=${(doc as { slug?: string })?.slug || ''}`,
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { _status: { equals: 'published' } }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  versions: {
    drafts: {
      autosave: { interval: 800 },
      schedulePublish: true,
    },
    maxPerDoc: 25,
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.publishedAt && data._status === 'published') {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [revalidatePost],
    afterDelete: [revalidatePostAfterDelete],
  },
  fields: [
    // Tabs container — the SEO plugin appends its own "SEO" tab at the end
    // (because `tabbedUI: true` in payload.config). Sidebar fields stay
    // outside the tabs.
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              maxLength: 140,
              admin: {
                description:
                  'Main title. Also used as default meta title. Keep under ~60 characters.',
              },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              maxLength: 220,
              admin: {
                description:
                  'Korte samenvatting (≤ 220 tekens). Gebruikt in listing en als fallback meta description.',
              },
            },
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description: 'Hero image bovenaan + fallback Open Graph image. ≥ 1600×900.',
              },
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
              admin: {
                description:
                  'De body. Gebruik H2/H3 voor sectie-kopjes — die laat Google soms in rich results zien.',
              },
            },
          ],
        },
        {
          label: 'Classification',
          fields: [
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
            },
            {
              name: 'author',
              type: 'relationship',
              relationTo: 'users',
              required: false,
            },
          ],
        },
      ],
    },
    // Sidebar fields
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'URL-fragment. Wordt automatisch van de titel gemaakt.',
      },
      hooks: {
        beforeValidate: [
          ({ value, data, operation }) => {
            if (typeof value === 'string' && value.length > 0) return slugify(value)
            if (operation === 'create' || !value) {
              const source = (data as { title?: string })?.title
              if (source) return slugify(source)
            }
            return value
          },
        ],
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Datum die in de listing en sitemap verschijnt. Leeg = "vandaag" bij publish.',
      },
    },
  ],
}
