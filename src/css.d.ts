// Allow side-effect imports of CSS files (e.g. `import './styles.css'`).
// Next.js normally declares these via the generated `next-env.d.ts`, but that
// file is gitignored and may not exist when type-checking runs in CI, so we
// declare the module type explicitly here.
declare module '*.css'
declare module '*.scss'
declare module '*.sass'

// The Payload-generated routes import this CSS bundle via a package subpath
// (`@payloadcms/next/css`). The specifier has no `.css` suffix, so the wildcard
// declarations above don't cover it; declare it explicitly.
declare module '@payloadcms/next/css'
