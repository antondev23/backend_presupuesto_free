import genAI from '../services/gemini.service.js'

export async function calcularPresupuesto(req, res) {
    try {
        const { tipoProyecto, funcionalidades, tiempoProyecto, descripcion } = req.body

        const prompt = `
Eres un experto en presupuestar proyectos freelance de desarrollo de software.

Datos del proyecto:
- Tipo: ${tipoProyecto}
- Funcionalidades: ${funcionalidades.join(', ') || 'Ninguna especificada'}
- Tiempo estimado por el cliente: ${tiempoProyecto}
- Descripción: ${descripcion || 'Sin descripción adicional'}

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin texto adicional) con esta estructura exacta:
    (mostrando siempre una respuesta amigable y profesional, sin usar lenguaje técnico innecesario)
{
  "precioMinimo": number,
  "precioRecomendado": number,
  "precioMaximo": number,
  "horasEstimadas": number,
  "justificacion": "string explicando el precio en 2-3 frases",
  "consejosNegociacion": ["consejo 1", "consejo 2"],
  "detallesAdicionales": "string con información adicional sobre el proyecto"
}
    `.trim()

        const response = await genAI.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
        })

        const textoLimpio = response.text.replace(/```json|```/g, '').trim()
        const resultado = JSON.parse(textoLimpio)

        res.json(resultado)
    } catch (error) {
        console.error('Error llamando a Gemini:', error)
        res.status(500).json({ error: 'Error al conectar con la IA' })
    }
}
