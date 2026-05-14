import Prerenderer from '@prerenderer/prerenderer'
import JSDOMRenderer from '@prerenderer/renderer-jsdom'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const prerenderer = new Prerenderer({
  staticDir: path.join(__dirname, 'dist'),
  renderer: new JSDOMRenderer()
})

const routes = ['/', '/stays', '/about', '/support']

prerenderer.initialize()
  .then(() => prerenderer.renderRoutes(routes))
  .then((renderedRoutes) => {
    renderedRoutes.forEach(({ route, html }) => {
      const outputDir = path.join(__dirname, 'dist', route)
      fs.mkdirSync(outputDir, { recursive: true })
      fs.writeFileSync(path.join(outputDir, 'index.html'), html)
      console.log(`Prerendered: ${route}`)
    })
    return prerenderer.destroy()
  })
  .then(() => console.log('Prerendering complete'))
  .catch((err) => {
    console.error('Prerender error:', err)
    process.exit(1)
  })
