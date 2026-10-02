const puppeteer = require("puppeteer-core")

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1600, height: 1000 })
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

  const openViewer = async () => {
    await page.goto("http://localhost:3000/app/radiografias", { waitUntil: "networkidle2", timeout: 90000 })
    try {
      await page.waitForSelector("main img, main button", { timeout: 30000 })
    } catch {
      const url = page.url()
      const html = await page.evaluate(() => document.body.innerText.slice(0, 500))
      console.log("FALHA no seletor. url:", url, "| body:", JSON.stringify(html))
      throw new Error("seletor falhou")
    }
    await new Promise((r) => setTimeout(r, 500))
    const clicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("main button")).find((b) => b.className.includes("aspect"))
      if (!btn) return false
      btn.click()
      return true
    })
    if (!clicked) throw new Error("card da radiografia não encontrado")
    try {
      await page.waitForFunction(
        () => Array.from(document.querySelectorAll("svg")).some((s) => (s.getAttribute("class") || "").includes("touch-none")),
        { timeout: 90000 },
      )
    } catch {
      const body = await page.evaluate(() => document.body.innerText.slice(0, 800))
      console.log("SVG visualizador não apareceu. body:", JSON.stringify(body))
      throw new Error("visualizador não abriu")
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
  await openViewer()

  const clickLupa = async () => {
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => (x.getAttribute("title") || "") === "Lupa")
      if (b) b.click()
    })
    await new Promise((r) => setTimeout(r, 300))
  }
  await clickLupa()

  const target = await page.evaluate(() => {
    const svg = Array.from(document.querySelectorAll("svg")).find((s) => s.getAttribute("viewBox") && (s.getAttribute("class") || "").includes("touch-none"))
    if (!svg) return null
    const r = svg.getBoundingClientRect()
    return { x: r.x + r.width * 0.4, y: r.y + r.height * 0.4 }
  })
  if (!target) throw new Error("SVG do visualizador não localizado para captura")
  await page.mouse.click(target.x, target.y)
  await new Promise((r) => setTimeout(r, 2000))

  const snapsAfter = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img")).filter((i) => i.src.startsWith("data:image/png")).length,
  )
  console.log("snapshots após captura:", snapsAfter)
  if (snapsAfter === 0) throw new Error("captura não gerou snapshot")

  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent.includes("Salvar trabalho"))
    if (b) b.click()
  })
  await new Promise((r) => setTimeout(r, 5000))
  const bodySaved = await page.evaluate(() => document.body.innerText)
  console.log("toast salvo:", bodySaved.includes("Anotações salvas"))

  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent.trim() === "Fechar")
    if (b) b.click()
  })
  await new Promise((r) => setTimeout(r, 2000))

  await openViewer()
  await new Promise((r) => setTimeout(r, 2500))
  const snapsReload = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img")).filter((i) => i.src.startsWith("data:image/png")).length,
  )
  console.log("snapshots após recarregar visualizador:", snapsReload)

  await browser.close()
  console.log(errs.length ? "ERROS: " + JSON.stringify(errs) : "ZERO erros de console")
  process.exit(errs.length || snapsReload === 0 ? 1 : 0)
}

main().catch((e) => {
  console.error("FALHOU:", e.message)
  process.exit(1)
})