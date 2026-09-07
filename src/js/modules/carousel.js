// Configures carousel scroll distance: one pass through the cards, then restart.
export function initCarousel () {
  const track = document.querySelector('.card-track')
  const container = track?.parentElement
  if (!track || !container) return

  let lastDistance = null

  const setScrollDistance = () => {
    const distance = Math.max(track.scrollWidth - container.clientWidth, 0)
    if (distance === lastDistance) return
    lastDistance = distance
    track.style.setProperty('--scroll-distance', `${distance}px`)
  }

  setScrollDistance()

  // Bredden er ikke endelig ved DOMContentLoaded: kortbildene lastes med
  // loading="lazy" og fonter kan skifte layouten etterpaa. Maaler vi bare da,
  // kan scrollWidth vaere mindre enn containeren, avstanden klemmes til 0 av
  // Math.max, og karusellen staar stille. Derfor maaler vi paa nytt naar alt
  // er lastet og hver gang containeren endrer stoerrelse.
  window.addEventListener('load', setScrollDistance)
  window.addEventListener('resize', setScrollDistance)

  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(setScrollDistance)
    observer.observe(container)
    observer.observe(track)
  }
}
