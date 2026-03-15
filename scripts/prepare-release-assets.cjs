const fs = require('node:fs')
const path = require('node:path')
const pngToIco = require('png-to-ico').default

const rootDir = path.resolve(__dirname, '..')
const sourcePngPath = path.join(rootDir, 'public', 'logodoapp.png')
const buildDir = path.join(rootDir, 'build')
const targetPngPath = path.join(buildDir, 'icon.png')
const targetIcoPath = path.join(buildDir, 'icon.ico')

function ensureSourceExists() {
  if (!fs.existsSync(sourcePngPath)) {
    throw new Error(`Missing source icon: ${sourcePngPath}`)
  }
}

async function main() {
  ensureSourceExists()
  fs.mkdirSync(buildDir, { recursive: true })

  const pngBuffer = fs.readFileSync(sourcePngPath)
  fs.copyFileSync(sourcePngPath, targetPngPath)
  const icoBuffer = await pngToIco(sourcePngPath)
  fs.writeFileSync(targetIcoPath, icoBuffer)

  console.log(`Prepared release icons in ${buildDir}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
