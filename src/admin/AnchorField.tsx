'use client'

import React, { useEffect, useState } from 'react'
import { useField, useDocumentInfo } from '@payloadcms/ui'
import { extractAnchors, type AnchorOption } from '../utils/anchors'

/**
 * Custom field rendered inside the Link drawer of the rich-text editor.
 *
 * Reads the current Post's `body` from the document info, finds every H2/H3
 * heading, slugifies them with the SAME function the frontend uses to emit
 * `id="…"` attributes, and exposes them as a dropdown.
 *
 * Picking an option writes `#{slug}` into the sibling `url` field of the
 * link drawer.
 */
export const AnchorField: React.FC = () => {
  const { id, collectionSlug } = useDocumentInfo()
  const { setValue: setUrl, value: urlValue } = useField<string>({ path: 'url' })

  // Pre-select whatever the URL field currently is, so editing an existing
  // link shows the right option.
  const initial = typeof urlValue === 'string' && urlValue.startsWith('#') ? urlValue.slice(1) : ''
  const [selected, setSelected] = useState<string>(initial)
  const [options, setOptions] = useState<AnchorOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pull the body from the host post once on mount. The drawer lives in its
  // own form context so we can't useWatchForm() the body directly — REST
  // gives us a stable snapshot.
  useEffect(() => {
    if (!id || collectionSlug !== 'posts') return
    let cancelled = false
    setLoading(true)
    fetch(`/api/posts/${id}?depth=0&draft=true`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((doc) => {
        if (cancelled) return
        setOptions(extractAnchors((doc as { body?: unknown })?.body))
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, collectionSlug])

  const noAnchors = !loading && options.length === 0
  const choose = (next: string) => {
    setSelected(next)
    if (next) setUrl(`#${next}`)
  }

  // Don't render outside posts (e.g. on other collections that may share
  // this rich-text feature in the future).
  if (collectionSlug !== 'posts') return null

  return (
    <div className="field-type" style={{ marginBottom: '1rem' }}>
      <label className="field-label" htmlFor="anchor-picker">
        Anker (kop uit deze post)
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          id="anchor-picker"
          value={selected}
          onChange={(e) => choose(e.target.value)}
          disabled={loading || noAnchors}
          style={{ flex: 1, padding: '0.5rem' }}
        >
          <option value="">— kies een kop —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.level === 'h3' ? '   ' : ''}
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {loading && <p style={{ fontSize: 12, opacity: 0.7 }}>Koppen laden…</p>}
      {error && <p style={{ fontSize: 12, color: 'tomato' }}>Kon koppen niet laden: {error}</p>}
      {noAnchors && !error && (
        <p style={{ fontSize: 12, opacity: 0.7 }}>
          Geen H2/H3 in deze post gevonden. Voeg eerst een kop toe.
        </p>
      )}
      <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
        Of typ zelf <code>#jouw-anker</code> in het URL-veld hieronder.
      </p>
    </div>
  )
}

export default AnchorField
