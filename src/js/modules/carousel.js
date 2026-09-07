// Configures carousel scroll distance: one pass through the cards, then restart.
export function initCarousel () {
  const track = document.querySelector('.card-track')
  const container = track?.parentElement
  if (!track || !container) return

  const setScrollDistance = () => {
    const distance = Math.max(track.scrollWidth - container.clientWidth, 0)
    track.style.setProperty('--scroll-distance', `${distance}px`)
  }

  setScrollDistance()
  window.addEventListener('resize', setScrollDistance)
}
