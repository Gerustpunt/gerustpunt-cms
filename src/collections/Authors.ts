import type { CollectionConfig } from 'payload'
import { anyone, authenticated } from '../access'
import { slugField } from '../fields/slug'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role'],
    group: 'Blog',
    description:
      'Bylines on blog posts. Helps with E-E-A-T (Experience, Expertise, Authoritativeness, Trust) for Google.',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'role',
      type: 'text',
      admin: { description: 'Bijv. "Exposurecoach", "Gerustpunt team"' },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: { description: 'Korte bio onder elke post.' },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'social',
      type: 'group',
      fields: [
        { name: 'twitter', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'website', type: 'text' },
      ],
    },
  ],
}
