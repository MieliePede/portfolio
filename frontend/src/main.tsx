import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import {StrictMode, type ComponentProps} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter, Link as RouterLink} from 'react-router-dom'
import {Theme} from '@astryxdesign/core/theme'
import {LinkProvider} from '@astryxdesign/core/Link'
import {themes, defaultThemeSlug} from './astryx-themes'
import App from './App'

// Astryx links and link-buttons pass `href`; React Router wants `to`. Absolute URLs (https:, mailto:) still render a plain <a>.
function AppLink({href = '', ...props}: ComponentProps<'a'>) {
  return <RouterLink to={href} {...props} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Theme theme={themes[defaultThemeSlug]}>
        <LinkProvider component={AppLink}>
          <App />
        </LinkProvider>
      </Theme>
    </BrowserRouter>
  </StrictMode>,
)
