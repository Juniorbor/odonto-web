const puppeteer = require("puppeteer-core")

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  const page = await browser.newPage()

  let loads = 0
  page.on("framenavigated", (f) => {
    if (f === page.mainFrame()) loads++
  })

  await page.goto("http://localhost:3456/", { waitUntil: "networkidle2", timeout: 90000 })
  await new Promise((r) => setTimeout(r, 3000))

  const wsState = await page.evaluate(() => {
    const patch = window.location.reload.toString().includes("hmrDown")
    return { patchInstalled: patch }
  })
  console.log("Patch instalado na página:", wsState.patchInstalled)

  await page.evaluate(() => location.reload())
  await new Promise((r) => setTimeout(r, 6000))

  console.log(`NAVEGAÇÕES (incial + reload manual): ${loads}`)
  if (loads === 2) {
    console.log("RESULTADO: reload manual FUNCIONA (HMR normal não foi quebrado)")
  } else {
    console.log("RESULTADO: problema no reload manual")
  }
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})