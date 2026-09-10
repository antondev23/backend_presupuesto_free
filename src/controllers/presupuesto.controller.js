import genAI from '../services/gemini.service.js'

function toNumber(value) {
    const number = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
    return Number.isFinite(number) ? number : null
}

function textOrFallback(value, fallback) {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function arrayOrFallback(value, fallback) {
    return Array.isArray(value) && value.some((item) => String(item).trim())
        ? value.filter((item) => String(item).trim())
        : fallback
}

function parseJsonResponse(text) {
    const responseText = String(text || '').trim()
    const jsonStart = responseText.indexOf('{')
    const jsonEnd = responseText.lastIndexOf('}')

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new Error('La IA no devolvió un JSON válido')
    }

    return JSON.parse(responseText.slice(jsonStart, jsonEnd + 1))
}

function normalizeResult(result) {
    const presupuesto = result.presupuesto || {}
    const tiempoEstimado = result.tiempoEstimado || {}
    const minimo = toNumber(
        presupuesto.minimo ?? presupuesto.precioMinimo ?? result.precioMinimo,
    )
    const recomendado = toNumber(
        presupuesto.recomendado ?? presupuesto.precioRecomendado ?? result.precioRecomendado,
    )
    const maximo = toNumber(
        presupuesto.maximo ?? presupuesto.precioMaximo ?? result.precioMaximo,
    )
    const horas = toNumber(
        tiempoEstimado.horas ?? tiempoEstimado.horasEstimadas ?? result.horasEstimadas,
    )

    if ([minimo, recomendado, maximo, horas].some((value) => value === null)) {
        throw new Error('La respuesta de la IA no contiene valores numéricos válidos')
    }

    return {
        titulo: textOrFallback(result.titulo, '✨ Estimación del proyecto'),
        resumen: textOrFallback(result.resumen, 'Estimación basada en la información proporcionada.'),
        presupuesto: {
            minimo,
            recomendado,
            maximo,
            moneda: presupuesto.moneda || 'USD',
        },
        tiempoEstimado: {
            horas,
            descripcion: textOrFallback(
                tiempoEstimado.descripcion,
                'El tiempo puede variar según el alcance final.',
            ),
        },
        justificacion: textOrFallback(
            result.justificacion,
            'La estimación considera el alcance y el tiempo indicados.',
        ),
        incluye: arrayOrFallback(result.incluye, ['Revisión del alcance del proyecto']),
        consejos: arrayOrFallback(
            result.consejos || result.consejosNegociacion,
            ['Confirma el alcance y los entregables antes de comenzar.'],
        ),
        siguientePaso: textOrFallback(
            result.siguientePaso,
            'Define el alcance final y confirma los entregables.',
        ),
    }
}

export async function calcularPresupuesto(req, res) {
    try {
        const {
            experiencia,
            tipoProyecto,
            funcionalidades,
            otraFuncionalidad,
            otroTipoProyecto,
            tiempoProyecto,
            descripcion,
        } = req.body

        if (!tipoProyecto || !tiempoProyecto || !Array.isArray(funcionalidades)) {
            return res.status(400).json({
                error: 'Faltan datos válidos del proyecto para calcular el presupuesto',
            })
        }

            const funcionalidadesTexto = funcionalidades
            .filter(Boolean)
            .concat(otraFuncionalidad && funcionalidades.includes('Otros') ? [otraFuncionalidad] : [])
            .join(', ')
        const tipoProyectoTexto = tipoProyecto !== 'otro'
            ? tipoProyecto
            : otroTipoProyecto || 'Otro'

        const prompt = `
Eres un experto en estimar presupuestos para servicios freelance de cualquier industria creativa, técnica o profesional. Puedes analizar proyectos de desarrollo de software, música, producción o edición de video, diseño y edición de imágenes, fotografía, animación, redacción, marketing, consultoría y cualquier otra categoría que el cliente describa.

Calcula una estimación razonable considerando el tipo de servicio, el alcance, las funcionalidades o entregables, el tiempo solicitado y la experiencia de la persona freelance. Si el proyecto no es de software, interpreta "funcionalidades" como tareas, entregables, piezas o servicios incluidos.

Datos del proyecto:
- Experiencia del freelancer: ${experiencia || 'No especificada'}
- Tipo de proyecto o servicio: ${tipoProyectoTexto}
- Funcionalidades: ${funcionalidadesTexto || 'Ninguna especificada'}
- Tiempo estimado por el cliente: ${tiempoProyecto}
- Contexto: ${descripcion || 'Sin descripción adicional'}

Responde en español con un tono amigable, claro y profesional. Usa emojis con moderación para organizar y hacer más cercana la respuesta, sin inventar datos que el cliente no proporcionó. Usa la experiencia del freelancer para ajustar la estimación y explica brevemente cualquier supuesto importante.

Responde ÚNICAMENTE con un JSON válido, sin markdown ni texto adicional, usando exactamente esta estructura:
{
    "titulo": "string breve y amigable con un emoji",
    "resumen": "string de 1-2 frases que explique la propuesta",
    "presupuesto": {
        "minimo": number,
        "recomendado": number,
        "maximo": number,
        "moneda": "USD"
    },
    "tiempoEstimado": {
        "horas": number,
        "descripcion": "string breve sobre el tiempo estimado"
    },
    "justificacion": "string explicando la estimación en 2-3 frases",
    "incluye": ["entregable o tarea incluida 1", "entregable o tarea incluida 2"],
    "consejos": ["consejo útil 1", "consejo útil 2"],
    "siguientePaso": "string con una recomendación clara para continuar"
}
    `.trim()

        const response = await genAI.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
        })

        const resultado = normalizeResult(parseJsonResponse(response.text))

        res.json(resultado)
    } catch (error) {
        console.error('Error llamando a Gemini:', error)
        res.status(500).json({ error: error.message || 'Error al conectar con la IA' })
    }
}
