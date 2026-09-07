import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import presupuestoRoutes from './routes/presupuesto.routes.js'

dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) })

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Falta GEMINI_API_KEY. Revisa las variables de entorno.')
}

console.log('API Key cargada:', process.env.GEMINI_API_KEY ? 'Sí' : 'No')

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL // https://presupuesto-free.vercel.app
].filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend funcionando 🚀' })
})

app.use('/api', presupuestoRoutes)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`)
})