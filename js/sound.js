// Ambient soundscape shared by the home, about and resources pages.
// State (playing, position, volume) is kept in sessionStorage so the
// soundscape carries on across page loads instead of restarting.

const KEY = "disordered:sound"
const SRC = "assets/media/soundscape.m4a"

function load() {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || {} } catch { return {} }
}

function save(state) {
  try { sessionStorage.setItem(KEY, JSON.stringify(state)) } catch {}
}

export function initSound() {
  const saved = load()
  const audio = new Audio(SRC)
  audio.loop = true
  audio.preload = saved.playing ? "auto" : "metadata"
  audio.volume = saved.volume ?? 0.5

  if (saved.time) {
    audio.addEventListener("loadedmetadata", () => { audio.currentTime = saved.time % audio.duration }, { once: true })
  }

  const render = () => {
    document.documentElement.dataset.sound = audio.paused ? "paused" : "playing"
    document.querySelectorAll("[data-sound-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(!audio.paused))
    })
  }

  const persist = (playing = !audio.paused) =>
    save({ playing, time: audio.currentTime, volume: audio.volume })

  audio.addEventListener("play", render)
  audio.addEventListener("pause", render)
  addEventListener("pagehide", () => persist())

  document.querySelectorAll("[data-sound-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => (audio.paused ? audio.play() : audio.pause()))
  })

  document.querySelectorAll("[data-sound-volume]").forEach((input) => {
    input.value = Math.round(audio.volume * 100)
    input.addEventListener("input", () => {
      audio.volume = input.value / 100
      if (audio.paused && audio.volume > 0) audio.play()
    })
  })

  // Browsers may block resuming without a fresh gesture; the UI then shows paused.
  if (saved.playing) audio.play().catch(render)
  render()

  return {
    // Fade the soundscape out before entering an experience, and don't resume it afterwards.
    fadeOut(ms = 800) {
      persist(false)
      if (audio.paused) return Promise.resolve()
      const start = audio.volume
      const t0 = performance.now()
      return new Promise((resolve) => {
        const step = (now) => {
          const k = Math.min(1, (now - t0) / ms)
          audio.volume = start * (1 - k)
          if (k < 1) return requestAnimationFrame(step)
          audio.pause()
          audio.volume = start
          persist(false)
          resolve()
        }
        requestAnimationFrame(step)
      })
    },
  }
}
