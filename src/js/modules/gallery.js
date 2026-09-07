// Inline gallery rendering + toggle helpers for the card collection.
import { setSafeText, sanitizeText } from '../core/utils.js'

function collapseGallery (btn, inline, container, seeAllContainer) {
  if (container) container.style.display = ''
  if (seeAllContainer) seeAllContainer.style.display = ''
  inline.style.display = 'none'
  inline.setAttribute('aria-hidden', 'true')
  btn?.focus()
}

export function initGallery () {
  const btn = document.getElementById('seeAllBtn')
  const inline = document.getElementById('galleryInline')
  if (!btn || !inline) return

  const renderGridOnce = () => {
    if (inline.dataset.rendered === 'true') return
    const header = document.createElement('div')
    header.className = 'gallery-inline-header gallery-inline-header-flex'
    const h2 = document.createElement('h2')
    h2.className = 'gallery-inline-header-h2'
    h2.textContent = 'Alle bilder'
    const collapse = document.createElement('button')
    collapse.className = 'collapse-btn'
    collapse.textContent = 'Vis mindre'
    collapse.addEventListener('click', () => {
      const container = document.querySelector('.card-container')
      const seeAllContainer = document.querySelector('.see-all-container')
      collapseGallery(btn, inline, container, seeAllContainer)
    })
    header.appendChild(h2)
    header.appendChild(collapse)

    const grid = document.createElement('div')
    grid.className = 'gallery-grid'
    grid.id = 'galleryGridInline'

    document.querySelectorAll('.card-track > .card-link').forEach((link) => {
      if (link.getAttribute('aria-hidden') === 'true') return
      const href = link.href
      const card = link.querySelector('.card')

      // Sanitize extracted text
      const rawTitle = card?.querySelector('h3')?.textContent?.trim() || ''
      const rawSubtitle = card?.querySelector('p')?.textContent?.trim() || ''
      const title = sanitizeText(rawTitle, { maxLength: 200 })
      const subtitle = sanitizeText(rawSubtitle, { maxLength: 500 })

      const style = card?.getAttribute('style') || ''

      const item = document.createElement('div')
      item.className = 'gallery-item project-button'
      item.setAttribute('role', 'group')
      item.setAttribute('tabindex', '0')

      const a = document.createElement('a')
      a.className = 'gallery-link'

      // Validate and sanitize URL
      try {
        const url = new URL(href)
        // Only allow http/https protocols
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          a.href = href
        } else {
          console.warn('Invalid URL protocol:', url.protocol)
          return
        }
      } catch (error) {
        console.warn('Invalid URL:', href)
        return
      }

      a.target = '_blank'
      a.rel = 'noopener noreferrer'

      const inner = document.createElement('div')
      inner.className = 'featured-project-card gallery-card'

      // Sanitize inline styles (only allow safe properties)
      if (style) {
        const safeStyle = style.replace(/[<>'"]/g, '')
        inner.setAttribute('style', safeStyle)
      }

      if (title) {
        // Use textContent for aria-label (already safe)
        inner.setAttribute('aria-label', title)
      }

      const overlay = document.createElement('div')
      overlay.className = 'gallery-overlay'
      const h = document.createElement('h3')
      setSafeText(h, title)
      const p = document.createElement('p')
      setSafeText(p, subtitle)
      overlay.appendChild(h)
      overlay.appendChild(p)

      inner.appendChild(overlay)
      a.appendChild(inner)
      item.appendChild(a)
      grid.appendChild(item)
    })

    inline.appendChild(header)
    inline.appendChild(grid)
    inline.dataset.rendered = 'true'
  }

  const openInline = () => {
    renderGridOnce()
    const container = document.querySelector('.card-container')
    const seeAllContainer = document.querySelector('.see-all-container')
    if (container) container.style.display = 'none'
    if (seeAllContainer) seeAllContainer.style.display = 'none'
    inline.style.display = 'block'
    inline.setAttribute('aria-hidden', 'false')
    inline.scrollIntoView({ behavior: 'smooth' })
  }

  btn.addEventListener('click', openInline)
}
