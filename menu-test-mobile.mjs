import puppeteer from "puppeteer-core"

const BASE = "https://odonto-web.onrender.com"
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

async function main() {
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@odontoweb.com.br", password: "Admin@2026", remember: true }),
  })
  if (!login.ok) {
    console.log("LOGIN FAILED", login.status, await login.text())
    process.exit(1)
  }
  const raw = login.headers.get("set-cookie")
  const cookie = raw.split(";")[0]

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" })
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  const consoleErrors = []
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[error] ${m.text()}`)
  })
  page.on("pageerror", (e) => consoleErrors.push(`[pageerror] ${e.message}`))
  page.on("requestfailed", (r) => consoleErrors.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`))

  await page.setCookie({ name: cookie.split("=")[0], value: cookie.split("=")[1], url: BASE })
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle2", timeout: 60000 })
  await new Promise((r) => setTimeout(r, 1500))

  console.log("== URL:", page.url())

  const openMenu = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Abrir menu")
    if (!b) return "not-found"
    b.click()
    return "clicked"
  })
  console.log("== open hamburger:", openMenu)
  await new Promise((r) => setTimeout(r, 1200))

  const items = await page.evaluate(() => {
    return [...document.querySelectorAll("aside a")].map((a) => ({
      text: a.innerText.trim().replace(/\s+/g, " "),
      href: a.getAttribute("href"),
    }))
  })
  console.log("== MOBILE MENU ITEMS:", JSON.stringify(items, null, 1))

  const clickDash = await page.evaluate(() => {
    const a = [...document.querySelectorAll("aside a")].find((x) => x.innerText.includes("Dashboard"))
    if (!a) return "not-found"
    a.click()
    return "clicked"
  })
  console.log("== click Dashboard:", clickDash)
  await new Promise((r) => setTimeout(r, 2000))
  console.log("== URL:", page.url())
  const overlayOpen = await page.evaluate(() => {
    const overlay = document.querySelector("aside")
    return overlay ? getComputedStyle(overlay).display : "no-aside"
  })
  console.log("== sidebar still visible:", overlayOpen)

  const openMenu2 = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.getAttribute("aria-label") === "Abrir menu")
    if (!b) return "not-found"
    b.click()
    return "clicked"
  })
  await new Promise((r) => setTimeout(r, 1000))
  const clickGerar = await page.evaluate(() => {
    const a = [...document.querySelectorAll("aside a")].find((x) => x.innerText.includes("Gerar"))
    if (!a) return "not-found"
    a.click()
    return "clicked"
  })
  console.log("== click Gerar:", clickGerar)
  await new Promise((r) => setTimeout(r, 2500))
  console.log("== URL:", page.url())
  const body = await page.evaluate(() => document.body.innerText.slice(0, 150).replace(/\n/g, " | "))
  console.log("== BODY:", JSON.stringify(body))
  console.log("== CONSOLE ERRORS:", JSON.stringify(consoleErrors))

  await browser.close()
}

main().catch((e) => {
  console.error("ERRO:", e)
  process.exit(1)
})