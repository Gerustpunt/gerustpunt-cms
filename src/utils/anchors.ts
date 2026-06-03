/**
 * Heading-anchor utilities shared between the CMS and the frontend renderer.
 * The frontend uses the SAME slugify so the IDs auto-emitted onto rendered
 * H2/H3 elements match what the editor picks from the dropdown.
 */

export type LexicalNodeLike = {
  type?: string
  tag?: string | number
  text?: string
  children?: LexicalNodeLike[]
}

export function slugifyAnchor(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function plainText(nodes: LexicalNodeLike[] | undefined): string {
  if (!nodes) return ''
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.text ?? ''
      if (n.children) return plainText(n.children)
      return ''
    })
    .join('')
}

export type AnchorOption = {
  /** Slug used in the URL: `#${id}` */
  id: string
  /** Heading text as shown to the editor */
  label: string
  /** `h2` | `h3` — for the picker UI's indent level */
  level: 'h2' | 'h3'
}

/**
 * Walk a Lexical body and return every H2/H3 heading along with the slug
 * that the frontend will assign to its rendered element.
 */
export function extractAnchors(body: unknown): AnchorOption[] {
  const root = (body as { root?: { children?: LexicalNodeLike[] } } | null)?.root
  if (!root?.children) return []

  const out: AnchorOption[] = []
  const seen = new Map<string, number>()

  for (const node of root.children) {
    if (node.type !== 'heading') continue
    const rawTag = String(node.tag ?? '').toLowerCase()
    if (rawTag !== 'h2' && rawTag !== 'h3') continue
    const text = plainText(node.children).trim()
    if (!text) continue

    const base = slugifyAnchor(text)
    if (!base) continue
    // Disambiguate repeats (`foo`, `foo-2`, `foo-3`).
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    const id = count === 1 ? base : `${base}-${count}`

    out.push({ id, label: text, level: rawTag })
  }
  return out
}
