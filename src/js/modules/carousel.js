// Configures carousel scroll distance and duplicates cards for seamless looping.
export function initCarousel () {
  const track = document.querySelector('.card-track')
  const container = track?.parentElement
  if (!track || !container) return

  // Duplicate all cards for seamless infinite loop
  const cards = Array.from(track.children)
  cards.forEach(card => {
    const clone = card.cloneNode(true)
    clone.setAttribute('aria-hidden', 'true')
    clone.style.pointerEvents = 'none'
    track.appendChild(clone)
  })

  const setScrollDistance = () => {
    const distance = Math.max(track.scrollWidth / 2 - container.clientWidth, 0)
    track.style.setProperty('--scroll-distance', `${distance}px`)
  }

  setScrollDistance()
  window.addEventListener('resize', setScrollDistance)
}
