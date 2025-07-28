import { launch } from 'puppeteer'
import readline from 'readline'
import fs from 'fs'

// Utils

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(r => rl.question(q, a => { rl.close(); r(a) }))
}

function getLast() {
  if (!fs.existsSync('history.txt')) return null
  const lines = fs.readFileSync('history.txt', 'utf8').trim().split('\n')
  const last = lines[lines.length - 1]
  return last?.split(' ')[0]
}

function setLast(id, email, password) {
  fs.appendFileSync('history.txt', `${id} ${email}:${password}\n`)
}

async function waitClick(page, selector) {
  await page.waitForSelector(selector, { visible: true })
  await page.click(selector)
}

// Init

let promise, proj, id, username, email, password

// Functions

async function register() {
  const browser = await launch({ headless: true, args: ['--start-maximized'] })
  const [page] = await browser.pages()
  await page.goto('https://stackblitz.com/register', { waitUntil: 'domcontentloaded' })

  const csrf = (await browser.cookies()).find(c => c.name === 'CSRF-TOKEN').value
  page.evaluate(async (user, csrf) => {
    fetch('https://stackblitz.com/api/users/registrations', {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': csrf, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user })
    })
  }, { email, username, password, password_confirmation: password }, csrf)

  await page.goto(`https://tuamaeaquelaursa.com/${id}`, { waitUntil: 'domcontentloaded' })
  await waitClick(page, '.the-message-from')
  await page.waitForSelector('body > div > section > main > table > tbody > tr > td > table:nth-child(1) > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td > span > a', { visible: true })
  const link = await page.$('body > div > section > main > table > tbody > tr > td > table:nth-child(1) > tbody > tr > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td > span > a')
  await page.goto(await (await link.getProperty('href')).jsonValue(), { waitUntil: 'domcontentloaded' })
  browser.close()

  console.log('[-/-] 🎉 Email confirmed!')
}

async function login() {
  console.log('[1/4] 🚀 Launching browser...')
  const browser = await launch({ headless: false, defaultViewport: null, args: ['--start-maximized'] })
  const [page] = await browser.pages()

  console.log('[2/4] 📋 Signing in...')
  await page.goto(`https://bolt.new/login?next=/~/${proj}`, { waitUntil: 'domcontentloaded' })
  await waitClick(page, 'button')

  while ((await browser.pages()).length === 1) { await new Promise(r => setTimeout(r, 50)) }
  const newPage = (await browser.pages())[1]

  await newPage.waitForSelector('._field_zm6r2_26', { visible: true })
  await newPage.type('._field_zm6r2_26', email)
  await newPage.click('._signInButton_12n2c_11')
  await newPage.waitForSelector('span._input_12n2c_1:nth-child(2) > input:nth-child(1)', { visible: true })
  await newPage.type('span._input_12n2c_1:nth-child(2) > input:nth-child(1)', password)
  await promise
  await newPage.click('._signInButton_12n2c_11')
  await page.bringToFront()

  console.log('[3/4] 📝 Answering survey...')
  await waitClick(page, '#root > div.relative.min-h-screen.flex.items-center.justify-center > div > button')
  await waitClick(page, 'button[type=submit]')
  await page.click('#role-founder-entrepeneur')
  await page.click('button.font-medium:nth-child(4)')
  await page.click('#workplace-solo')
  await page.click('button.font-medium:nth-child(4)')
  await page.click('#no_code_experience-beginner')
  await page.click('button.font-medium:nth-child(4)')
  await page.click('#usecase-myself')
  await page.click('button.font-medium:nth-child(4)')
  await page.click('#goals-build')
  await page.click('button.font-medium:nth-child(4)')
  await page.click('button[type=submit]')

  console.log('[4/4] 🎉 Script completed!')
  console.log(`Bolt: https://bolt.new/~/${proj}`)
  console.log(`User: ${email}`)
  console.log(`Password: ${password}`)

  const checkUrl = setInterval(async () => {
    const pages = await browser.pages()
    if (pages[0]) proj = pages[0].url().split('/').at(-1)
  }, 10e3)

  browser.on('disconnected', () => {
    clearInterval(checkUrl)
    main()
  })
}

// Main

async function main() {
  if (proj) setLast(proj, email, password)
  else proj = getLast()
  proj = await ask(`Project ID${proj ? '*' : ''}: `) || proj 

  id = Date.now()
  email = `${id}@tuamaeaquelaursa.com`
  username = `user-${id}`
  password = '@0AAaa'

  promise = register()
  login(proj)
}

main()
