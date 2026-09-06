import { Router } from 'express'
import { calcularPresupuesto } from '../controllers/presupuesto.controller.js'

const router = Router()

router.post('/calcular', calcularPresupuesto)

export default router