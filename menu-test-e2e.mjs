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
  page.on("requestfailed", (r) => consoleErrors.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`))

  // fluxo real de login
  await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 60000 })
  console.log("== login page title:", await page.title())
  await page.type('input[type="email"]', "admin@odontoweb.com.br")
  await page.type('input[type="password"]', "Admin@2026")
  await new Promise((r) => setTimeout(r, 300))
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.innerText.includes("Entrar"))
    b?.click()
  })
  await new Promise((r) => setTimeout(r, 5000))
  console.log("== after login URL:", page.url())

  const clicks = ["Dashboard", "Gerar relatório", "Agenda", "Novo Paciente", "Novo atendimento", "Odontograma", "Nova produção", "Financeiro"]
  for (const label of clicks) {
    const r = await page.evaluate((l) => {
      const a = [...document.querySelectorAll("nav a")].find((x) => x.innerText.trim().includes(l))
      if (!a) return "not-found"
      a.click()
      return `clicked -> ${a.getAttribute("href")}`
    }, label)
    await new Promise((t) => setTimeout(t, 2000))
    const url = page.url()
    const body = await page.evaluate(() => document.body.innerText.slice(0, 60).replace(/\n/g, " | "))
    console.log(`== ${label}: ${r} | URL=${url} | BODY=${JSON.stringify(body)}`)
  }

  console.log("== CONSOLE ERRORS:", JSON.stringify(consoleErrors, null, 1))
  await browser.close()
}

main().catch((e) => {
  console.error("ERRO:", e)
  process.exit(1)
})