import 'katex/dist/katex.min.css'
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.tsx'
import { parseLegacyHash, parsePath, routePath } from './router.ts'
import './styles.css'

const { base, route } = parsePath(window.location.pathname)
const legacy = parseLegacyHash(window.location.hash)

if (legacy && route.page === 'home') {
  // An old-style link such as '#/week/3': go to that week's own page.
  window.location.replace(base + routePath(legacy))
} else {
  const root = document.getElementById('root')!
  const app = (
    <StrictMode>
      <App initialRoute={route} base={base} />
    </StrictMode>
  )
  // A built copy already contains the page's HTML (see scripts/prerender.mjs), so
  // React attaches to it. Under `npm run dev` the root is empty and is drawn here.
  if (root.hasChildNodes()) hydrateRoot(root, app)
  else createRoot(root).render(app)
}
