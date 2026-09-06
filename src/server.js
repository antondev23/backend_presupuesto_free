import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import presupuestoRoutes from './routes/presupuesto.routes.js'

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) })

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Falta GEMINI_API_KEY. Revisa el archivo src/.env')
}


console.log('API Key cargada:', process.env.GEMINI_API_KEY ? 'Sí' : 'No')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend funcionando 🚀' })
})

app.use('/api', presupuestoRoutes)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
