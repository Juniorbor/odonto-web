const puppeteer = require("puppeteer-core")

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
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

  // 1. Catálogo de procedimentos
  await page.goto("http://localhost:3000/app/odontometria", { waitUntil: "networkidle2", timeout: 90000 })
  console.log("odontometria ->", page.url())
  await page.waitForFunction(() => document.body.innerText.includes("Novo procedimento"), { timeout: 30000 })
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll("h3")).some((h) => h.textContent.trim().length > 3),
    { timeout: 30000 },
  )
  const cardCount = await page.evaluate(() => document.querySelectorAll("h3").length)
  console.log("cards do catálogo:", cardCount)
  if (cardCount < 10) throw new Error("catálogo sem defaults (cards < 10)")

  // criar um procedimento customizado pela UI
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Novo procedimento"))
    btn.click()
  })
  await sleep(500)
  await page.type("input[placeholder*='Restauração em resina']", "Teste Endo 02")
  await page.type("input[placeholder*='REST01']", "END02")
  await page.type("input[placeholder*='Dentística, Endodontia']", "Endodontia")
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === "Criar procedimento")
    btn.click()
  })
  await sleep(1200)
  const hasCustom = await page.evaluate(() => document.body.innerText.includes("Teste Endo 02"))
  console.log("procedimento criado no catálogo:", hasCustom)
  if (!hasCustom) throw new Error("falha ao criar procedimento no catálogo")

  // 2. Ficha do paciente
  await page.goto("http://localhost:3000/app/pacientes", { waitUntil: "networkidle2", timeout: 90000 })
  await page.waitForFunction(() => document.querySelectorAll("a[href*='/app/pacientes/']").length > 0, { timeout: 30000 })
  const patientHref = await page.evaluate(() => {
    const a = Array.from(document.querySelectorAll("a[href*='/app/pacientes/']")).find((x) => {
      const href = x.getAttribute("href")
      return !href.endsWith("/novo") && !href.endsWith("/pacientes") && x.textContent.trim().length > 2
    })
    return a ? a.getAttribute("href") : null
  })
  if (!patientHref) throw new Error("nenhum paciente encontrado")
  console.log("paciente:", patientHref)

  await page.goto("http://localhost:3000" + patientHref, { waitUntil: "networkidle2", timeout: 90000 })
  await page.waitForFunction(() => document.body.innerText.includes("Procedimentos (Odontometria)"), { timeout: 30000 })
  console.log("seção Procedimentos presente na ficha")

  // registrar procedimento
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Registrar procedimento"))
    btn.click()
  })
  await sleep(600)
  await page.waitForFunction(() => document.body.innerText.toLowerCase().includes("procedimento do catálogo"), { timeout: 30000 })
  await page.evaluate(() => {
    const sel = Array.from(document.querySelectorAll("select")).find((s) => s.options.length > 2)
    const target = Array.from(sel.options).find((o) => o.textContent.includes("Exodontia simples"))
    sel.value = target.value
    sel.dispatchEvent(new Event("change", { bubbles: true }))
  })
  await sleep(800)
  // selecionar um dente (botão "18")
  await page.evaluate(() => {
    const tooth = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === "18")
    if (tooth) tooth.click()
  })
  await sleep(200)
  // selecionar uma face
  await page.evaluate(() => {
    const face = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === "M")
    if (face) face.click()
  })
  await sleep(200)
  // valor
  await page.evaluate(() => {
    const inp = Array.from(document.querySelectorAll("input")).find((i) => i.placeholder && i.placeholder.includes("250.00"))
    if (inp) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set
      setter.call(inp, "199.90")
      inp.dispatchEvent(new Event("input", { bubbles: true }))
    }
  })
  await sleep(300)
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === "Registrar")
    btn.click()
  })
  await page.waitForFunction(() => document.body.innerText.includes("R$ 199.90"), { timeout: 30000 })
  console.log("registro salvo e exibido: true")

  // 3. recarregar e conferir persistência
  await page.reload({ waitUntil: "networkidle2", timeout: 90000 })
  await page.waitForFunction(() => document.body.innerText.includes("Procedimentos (Odontometria)"), { timeout: 30000 })
  await page.waitForFunction(() => document.body.innerText.includes("R$ 199.90"), { timeout: 30000 })
  console.log("persistiu após reload: true")

  await browser.close()
  console.log(errs.length ? "ERROS: " + JSON.stringify(errs) : "ZERO erros de console")
  process.exit(errs.length ? 1 : 0)
}

main().catch((e) => {
  console.error("TEST-ERR:", e.message)
  process.exit(1)
})