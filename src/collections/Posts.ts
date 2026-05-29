import type { CollectionConfig } from 'payload'
import { slugify } from '../utils/slug'
import { revalidatePost, revalidatePostAfterDelete } from '../hooks/revalidatePost'

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gerustpunt.nl'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'publishedAt', 'updatedAt', '_status'],
    group: 'Blog',
    // Live Preview lets editors see the rendered frontend inside the admin.
    livePreview: {
      url: ({ data }) =>
        `${FRONTEND_URL}/api/preview?secret=${process.env.PREVIEW_SECRET || ''}&slug=${data?.slug || ''}`,
      breakpoints: [
        { name: 'mobile', label: 'Mobile', width: 375, height: 667 },
        { name: 'tablet', label: 'Tablet', width: 768, height: 1024 },
        { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
      ],
    },
    // Plain "Preview" button next to "Save" / "Publish" — opens a new tab.
    preview: (doc) =>
      `${FRONTEND_URL}/api/preview?secret=${process.env.PREVIEW_SECRET || ''}&slug=${(doc as { slug?: string })?.slug || ''}`,
  },
  access: {
    // Anyone can read published posts; drafts only via the preview token.
    read: ({ req: { user } }) => {
      if (user) return true
      return {
        _status: { equals: 'published' },
      }
    },
  },
  versions: {
    drafts: {
      autosave: { interval: 800 },
      schedulePublish: true,
    },
    maxPerDoc: 25,
  },
  hooks: {
    afterChange: [revalidatePost],
    afterDelete: [revalidatePostAfterDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 140,
    },
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
          ({ value, data }) => {
            if (value) return slugify(value)
            if (data?.title) return slugify(data.title)
            return value
          },
        ],
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Wordt gebruikt als datum in de listing en sitemap.',
      },
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 220,
      admin: {
        description: 'Korte samenvatting (≤ 220 tekens) voor de listing en social previews.',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
  ],
}
