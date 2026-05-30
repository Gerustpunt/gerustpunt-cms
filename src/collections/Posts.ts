import type { CollectionConfig } from 'payload'
import { publishedOrAuthenticated, authenticated } from '../access'
import { slugField } from '../fields/slug'
import { revalidatePost, revalidatePostAfterDelete } from '../hooks/revalidatePost'

const FRONTEND_URL = 'https://gerustpunt.nl'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Post', plural: 'Posts' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'authors', 'category', 'publishedAt', '_status'],
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
    read: publishedOrAuthenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
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
    // ─── Main content tab ──────────────────────────────────────────────
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
                  "De hoofdtitel — ook gebruikt als default meta title. Houd 'm onder ~60 tekens voor volledige weergave in Google.",
              },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              maxLength: 280,
              admin: {
                description:
                  'Korte samenvatting in de listing, RSS, en als fallback meta description. 140–160 tekens werkt het beste in zoekresultaten.',
              },
            },
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description:
                  'Bovenaan de post EN als default Open Graph / Twitter card image. Mik op 1600×900 of groter.',
              },
            },
            {
              name: 'body',
              type: 'richText',
              required: true,
              admin: {
                description:
                  'De body. Gebruik H2/H3 voor secties — die laat Google soms in rich results zien. Link naar gerelateerde Gerustpunt-pagina\'s waar zinvol.',
              },
            },
          ],
        },
        // ─── Meta / classification ───────────────────────────────────────
        {
          label: 'Classification',
          fields: [
            {
              name: 'authors',
              type: 'relationship',
              relationTo: 'authors',
              hasMany: true,
              required: true,
              admin: {
                description: 'Bylines. De meeste posts hebben één auteur.',
              },
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              required: true,
            },
            {
              name: 'tags',
              type: 'array',
              labels: { singular: 'Tag', plural: 'Tags' },
              admin: {
                description: 'Vrije keywords. Voor related-posts en topic clusters.',
              },
              fields: [{ name: 'tag', type: 'text', required: true }],
            },
            {
              name: 'relatedPosts',
              type: 'relationship',
              relationTo: 'posts',
              hasMany: true,
              filterOptions: ({ id }) => ({ id: { not_equals: id } }),
              admin: {
                description:
                  'Handmatig gekozen gerelateerde posts. Onderaan de post getoond — vermindert bounce rate en versterkt topic clusters voor SEO.',
              },
            },
          ],
        },
        // ─── Advanced SEO (beyond what the SEO plugin handles) ──────────
        {
          label: 'Advanced SEO',
          fields: [
            {
              name: 'focusKeyword',
              type: 'text',
              admin: {
                description:
                  'Het primaire keyword waar je deze post mee wil ranken. Niet gepubliceerd — alleen schrijfgids.',
              },
            },
            {
              name: 'canonicalOverride',
              type: 'text',
              admin: {
                description:
                  'Leeg laten voor default. Alleen invullen als de canonical URL ergens anders naar moet wijzen.',
              },
            },
            {
              name: 'noindex',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description:
                  'Verberg deze post voor Google en andere zoekmachines.',
              },
            },
            {
              name: 'schemaType',
              type: 'select',
              defaultValue: 'BlogPosting',
              options: [
                { label: 'Blog post (default)', value: 'BlogPosting' },
                { label: 'News article', value: 'NewsArticle' },
                { label: 'How-to guide', value: 'HowTo' },
                { label: 'FAQ page', value: 'FAQPage' },
                { label: 'Generic article', value: 'Article' },
              ],
              admin: {
                description:
                  'Vertelt Google wat voor content dit is. HowTo en FAQPage geven speciale rich results.',
              },
            },
            {
              name: 'faqs',
              type: 'array',
              admin: {
                condition: (data) => data?.schemaType === 'FAQPage',
                description:
                  'Q&A paren als FAQPage structured data — Google toont ze soms direct in zoekresultaten.',
              },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'textarea', required: true },
              ],
            },
          ],
        },
      ],
    },
    // ─── Sidebar ──────────────────────────────────────────────────────
    slugField('title'),
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description:
          'Datum die op de post verschijnt. Leeg = "vandaag" bij eerste publish. Update bij grote herschrijving — Google waardeert versheid.',
      },
    },
  ],
}
