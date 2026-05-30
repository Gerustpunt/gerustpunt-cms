import type { Field } from 'payload'

/**
 * URL slug auto-generated from a source field (default: `title`).
 * Editor can override manually — the field is editable.
 */
export const slugField = (sourceField = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'URL path — auto-generated from the title, but you can edit it. Use lowercase, dashes, no spaces.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data, operation }) => {
        if (typeof value === 'string' && value.length > 0) {
          return slugify(value)
        }
        if (operation === 'create' || !value) {
          const source = (data?.[sourceField] as string | undefined) ?? ''
          if (source) return slugify(source)
        }
        return value
      },
    ],
  },
})

function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
