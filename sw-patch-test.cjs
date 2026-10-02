const puppeteer = require("puppeteer-core")

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  const page = await browser.newPage()

  await page.evaluateOnNewDocument(() => {
    window.WebSocket = class {
      constructor() {
        setTimeout(() => {
          if (this.onerror) this.onerror(new Event("error"))
          if (this.onclose) this.onclose(new Event("close"))
        }, 50)
      }
      static get OPEN() { return 1 }
      static get CONNECTING() { return 0 }
      close() {}
      send() {}
    }
  })

  let loads = 0
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) loads++
  })

  await page.goto("http://localhost:3456/", { waitUntil: "domcontentloaded", timeout: 90000 })
  console.log("DEV carregada com WS bloqueado + patch anti-loop instalado. Observando 150s...")
  await new Promise((r) => setTimeout(r, 150000))

  console.log(`NAVEGAÇÕES EM 150s: ${loads}`)
  if (loads >= 4) {
    console.log("RESULTADO: LOOP AINDA ACONTECE (patch falhou)")
  } else {
    console.log("RESULTADO: LOOP BLOQUEADO PELO PATCH (página estável)")
  }
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})