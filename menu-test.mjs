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
  const consoleErrors = []
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[error] ${m.text()}`)
  })
  page.on("pageerror", (e) => consoleErrors.push(`[pageerror] ${e.message}`))
  page.on("requestfailed", (r) => consoleErrors.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`))
  const navs = []
  page.on("request", (r) => {
    if (r.isNavigationRequest() && !r.url().includes("/_next/static") && !r.url().includes("favicon")) navs.push(`${r.method()} ${r.url().replace(BASE, "")}`)
  })

  await page.setCookie({ name: cookie.split("=")[0], value: cookie.split("=")[1], url: BASE })
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle2", timeout: 60000 })
  await new Promise((r) => setTimeout(r, 2000))

  console.log("== TITLE:", await page.title())
  console.log("== URL:", page.url())

  const menu = await page.evaluate(() => {
    const items = [...document.querySelectorAll("nav a")].map((a) => ({
      text: a.innerText.trim().replace(/\s+/g, " "),
      href: a.getAttribute("href"),
      tag: a.tagName,
    }))
    const buttons = [...document.querySelectorAll("nav button")].map((b) => ({
      text: b.innerText.trim().replace(/\s+/g, " "),
      tag: b.tagName,
      role: b.getAttribute("role"),
    }))
    return { items, buttons }
  })
  console.log("== NAV LINKS:", JSON.stringify(menu.items, null, 1))
  console.log("== NAV BUTTONS:", JSON.stringify(menu.buttons, null, 1))

  const dashboard = await page.evaluate(() => {
    const a = [...document.querySelectorAll("nav a")].find((x) => x.innerText.includes("Dashboard"))
    if (!a) return "not-found"
    a.click()
    return "clicked:" + a.getAttribute("href")
  })
  console.log("== CLICK Dashboard:", dashboard)
  await new Promise((r) => setTimeout(r, 3000))
  console.log("== URL after Dashboard:", page.url())
  const bodyAfterDash = await page.evaluate(() => document.body.innerText.slice(0, 120).replace(/\n/g, " | "))
  console.log("== BODY after Dashboard:", JSON.stringify(bodyAfterDash))

  const gerar = await page.evaluate(() => {
    const a = [...document.querySelectorAll("nav a")].find((x) => x.innerText.includes("Gerar"))
    if (!a) return "not-found"
    a.click()
    return "clicked:" + a.getAttribute("href")
  })
  console.log("== CLICK Gerar:", gerar)
  await new Promise((r) => setTimeout(r, 3000))
  console.log("== URL after Gerar:", page.url())
  const bodyAfterGerar = await page.evaluate(() => document.body.innerText.slice(0, 120).replace(/\n/g, " | "))
  console.log("== BODY after Gerar:", JSON.stringify(bodyAfterGerar))

  console.log("== NAVS:", JSON.stringify(navs))
  console.log("== CONSOLE ERRORS:", JSON.stringify(consoleErrors))

  await browser.close()
}

main().catch((e) => {
  console.error("ERRO:", e)
  process.exit(1)
})