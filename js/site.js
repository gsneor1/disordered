// Shared behavior for the home, about and resources pages.
import { initSound } from "./sound.js"

const sound = initSound()

const CATEGORIES = {
  recharge: "Recharge",
  reassurance: "Reassurance",
  relax: "Relax & Recenter",
  grounding: "Grounding",
}

// ===== Dialogs =====
// Close on backdrop click; Escape is handled natively by <dialog>.
document.querySelectorAll("dialog.sheet").forEach((dialog) => {
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close()
  })
})

// ===== Cards with detail (about + resources) =====
// Each card holds its detail in a <template>; one shared dialog shows it.
const detail = document.getElementById("detail")
if (detail) {
  const body = detail.querySelector("[data-detail-body]")
  document.querySelectorAll("[data-card]").forEach((card) => {
    const trigger = card.querySelector(".card-trigger")
    trigger.addEventListener("click", () => {
      body.replaceChildren(card.querySelector("template").content.cloneNode(true))
      detail.showModal()
    })
  })
}

// ===== Home: category -> duration -> experience =====
const durationDialog = document.getElementById("duration")
if (durationDialog) {
  const title = durationDialog.querySelector("[data-category-title]")
  const links = durationDialog.querySelectorAll("[data-minutes]")

  const open = (category) => {
    if (!CATEGORIES[category]) return
    title.textContent = CATEGORIES[category]
    links.forEach((a) => { a.href = `experience.html?c=${category}&d=${a.dataset.minutes}` })
    durationDialog.showModal()
  }

  document.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => open(btn.dataset.category))
  })

  links.forEach((a) => {
    a.addEventListener("click", async (e) => {
      e.preventDefault()
      await sound.fadeOut()
      location.href = a.href
    })
  })

  // Returning from an experience (?c=recharge) reopens that category's choices.
  const params = new URLSearchParams(location.search)
  if (params.has("c")) {
    open(params.get("c"))
    history.replaceState(null, "", location.pathname)
  }
}
