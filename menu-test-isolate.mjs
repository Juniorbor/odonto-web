import puppeteer from "puppeteer-core"

const BASE = "https://odonto-web.onrender.com"
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" })
  const page = await browser.newPage()
  const consoleErrors = []
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[error] ${m.text()}`)
  })
  page.on("pageerror", (e) => consoleErrors.push(`[pageerror] ${e.message}`))

  // login via API e cookie direto
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@odontoweb.com.br", password: "Admin@2026", remember: true }),
  })
  const raw = login.headers.get("set-cookie")
  const cookie = raw.split(";")[0]
  await page.setCookie({ name: cookie.split("=")[0], value: cookie.split("=")[1], url: BASE })

  await page.goto(`${BASE}/app`, { waitUntil: "networkidle2", timeout: 60000 })
  await new Promise((r) => setTimeout(r, 3000))
  console.log("== start URL:", page.url())

  const sw = await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations()
    return regs.map((r) => r.active?.scriptURL)
  })
  console.log("== service workers:", JSON.stringify(sw))

  // navegação direta por href (sem .click()) para isolar o problema de clique
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("nav a")].map((a) => ({ text: a.innerText.trim().replace(/\s+/g, " "), href: a.getAttribute("href") }))
  )
  console.log("== nav hrefs:", JSON.stringify(hrefs))

  // agora clicar de verdade com espera entre cliques
  const labels = ["Agenda", "Novo Paciente", "Odontograma", "Nova produção", "Financeiro", "Gerar relatório"]
  for (const label of labels) {
    const r = await page.evaluate((l) => {
      const a = [...document.querySelectorAll("nav a")].find((x) => x.innerText.trim() === l)
      if (!a) return "not-found"
      a.click()
      return "clicked"
    }, label)
    await new Promise((t) => setTimeout(t, 3500))
    console.log(`== click ${label}: ${r} | URL=${page.url()}`)
    if (page.url() !== `${BASE}/app`) {
      // voltar para /app antes do próximo clique
      await page.goto(`${BASE}/app`, { waitUntil: "networkidle2", timeout: 60000 })
      await new Promise((t) => setTimeout(t, 2500))
    }
  }
  console.log("== CONSOLE ERRORS:", JSON.stringify(consoleErrors, null, 1))
  await browser.close()
}

main().catch((e) => {
  console.error("ERRO:", e)
  process.exit(1)
})