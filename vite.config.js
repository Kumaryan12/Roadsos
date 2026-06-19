import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import caseBriefHandler from './api/case-brief.js'

const readJsonBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      if (!body) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch (error) {
        reject(error)
      }
    })

    req.on('error', reject)
  })
}

const localApiResponse = (res) => {
  res.status = (statusCode) => {
    res.statusCode = statusCode
    return res
  }

  res.json = (payload) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(payload))
  }

  return res
}

const roadsosApiPlugin = () => ({
  name: 'roadsos-local-api',
  configureServer(server) {
    server.middlewares.use('/api/case-brief', async (req, res) => {
      try {
        req.body = await readJsonBody(req)
        await caseBriefHandler(req, localApiResponse(res))
      } catch (error) {
        console.error(error)
        res.statusCode = 400
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Invalid API request.' }))
      }
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), roadsosApiPlugin()],
})
