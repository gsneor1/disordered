// Full-screen experience: plays the video for ?c=<category>&d=<minutes>,
// then returns home when it ends.

const CATEGORIES = {
  recharge: "Recharge",
  reassurance: "Reassurance",
  relax: "Relax & Recenter",
  grounding: "Grounding",
}
const MINUTES = ["2", "5", "7"]
const IDLE_MS = 3000

const params = new URLSearchParams(location.search)
const category = params.get("c")
const minutes = params.get("d")

if (!CATEGORIES[category] || !MINUTES.includes(minutes)) {
  location.replace("index.html")
} else {
  start()
}

function start() {
  const player = document.body
  const video = document.getElementById("video")
  const surface = document.getElementById("surface")
  const mute = document.getElementById("mute")
  const volume = document.getElementById("volume")
  const hint = document.getElementById("unmute-hint")
  const message = document.getElementById("message")
  const progress = document.getElementById("progress")
  const exit = document.getElementById("exit")

  document.getElementById("title").textContent = `${CATEGORIES[category]} · ${minutes} min`
  document.title = `${CATEGORIES[category]} | Disordered`
  // Exit goes back home with this category's length choices open.
  exit.href = `index.html?c=${category}`

  const setState = (state) => {
    player.dataset.state = state
    surface.setAttribute("aria-label", state === "paused" ? "Play" : "Pause")
  }

  const renderMute = () => {
    player.toggleAttribute("data-muted", video.muted || video.volume === 0)
    mute.setAttribute("aria-label", video.muted ? "Unmute" : "Mute")
    if (!video.muted) hint.hidden = true
  }

  const flash = () => {
    player.setAttribute("data-flash", "")
    clearTimeout(flash.timer)
    flash.timer = setTimeout(() => player.removeAttribute("data-flash"), 700)
  }

  // ===== Idle: hide controls while playing undisturbed =====
  let idleTimer
  const wake = () => {
    player.removeAttribute("data-idle")
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      if (!video.paused) player.setAttribute("data-idle", "")
    }, IDLE_MS)
  }
  ;["pointermove", "pointerdown", "keydown"].forEach((type) => addEventListener(type, wake))

  // ===== Playback =====
  const unmute = () => {
    video.muted = false
    if (video.volume === 0) video.volume = 0.5
    volume.value = Math.round(video.volume * 100)
  }

  const toggle = () => {
    if (player.dataset.state === "loading" || player.dataset.state === "ended") return
    // While the "tap for sound" hint shows, the first tap turns sound on instead of pausing.
    if (!hint.hidden) return unmute()
    if (video.paused) {
      video.play()
      flash()
    } else {
      video.pause()
    }
  }

  video.volume = volume.value / 100
  video.src = `assets/video/${category}-${minutes}.mp4`

  video.addEventListener("canplay", async () => {
    try {
      await video.play()
    } catch {
      // Autoplay with sound was blocked: start muted and offer sound.
      video.muted = true
      hint.hidden = false
      await video.play().catch(() => setState("paused"))
    }
  }, { once: true })

  video.addEventListener("play", () => { setState("playing"); wake() })
  video.addEventListener("pause", () => { if (!video.ended) setState("paused"); wake() })
  video.addEventListener("volumechange", renderMute)
  video.addEventListener("timeupdate", () => {
    if (video.duration) progress.style.transform = `scaleX(${video.currentTime / video.duration})`
  })

  video.addEventListener("ended", () => {
    setState("ended")
    setTimeout(() => { location.href = "index.html" }, 1200)
  })

  video.addEventListener("error", () => {
    setState("error")
    message.textContent = "This experience couldn't load. Check your connection and try again."
    message.hidden = false
  })

  surface.addEventListener("click", toggle)
  hint.addEventListener("click", unmute)
  mute.addEventListener("click", () => (video.muted ? unmute() : (video.muted = true)))
  volume.addEventListener("input", () => {
    video.volume = volume.value / 100
    video.muted = video.volume === 0
  })

  addEventListener("keydown", (e) => {
    if (e.key === "Escape") return exit.click()
    // Focused buttons, links and sliders handle their own keys.
    if (e.target.closest("button, a, input")) return
    if (e.code === "Space") { e.preventDefault(); toggle() }
    else if (e.key === "m" || e.key === "M") mute.click()
  })

  // Release the video when leaving so mobile browsers stop decoding it.
  addEventListener("pagehide", () => {
    video.pause()
    video.removeAttribute("src")
    video.load()
  })
  // Coming back via the back button restores a page with no video; start fresh.
  addEventListener("pageshow", (e) => { if (e.persisted) location.reload() })

  renderMute()
}
