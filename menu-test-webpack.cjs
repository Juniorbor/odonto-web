const puppeteer = require("puppeteer-core")

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
  })
  const page = await browser.newPage()
  const errs = []
  page.on("console", (m) => {
    if (m.type() === "error") errs.push("CONSOLE: " + m.text())
  })
  page.on("pageerror", (e) => errs.push("PAGE: " + e.message))

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 90000 })
  await page.type("input[type=email]", "admin@odontoweb.com.br")
  await page.type("input[type=password]", "Admin@2026")
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 90000 }),
    page.click("button[type=submit]"),
  ])
  console.log("login ->", page.url())

  const items = ["Agenda", "Novo Paciente", "Novo atendimento", "Odontograma", "Nova produção", "Financeiro", "Gerar relatório"]
  for (const label of items) {
    await page.waitForSelector("nav a", { timeout: 30000 })
    const href = await page.evaluate((l) => {
      const a = Array.from(document.querySelectorAll("nav a")).find((x) => x.textContent.trim() === l)
      return a ? a.getAttribute("href") : null
    }, label)
    if (!href) {
      console.log(label + " -> not-found no menu")
      continue
    }
    await page.goto("http://localhost:3000" + href, { waitUntil: "networkidle2", timeout: 90000 })
    console.log(label + " -> " + page.url() + " OK")
  }
  await browser.close()
  console.log(errs.length ? "ERROS: " + JSON.stringify(errs) : "ZERO erros de console")
  process.exit(errs.length ? 1 : 0)
}

main().catch((e) => {
  console.error("TEST-ERR:", e.message)
  process.exit(1)
})
