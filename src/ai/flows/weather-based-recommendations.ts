
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Esquema de entrada para recomendaciones basadas en el clima
const GenerateRecommendationsInputSchema = z.object({
    location: z.string().describe('Ubicación del campo (por ejemplo, "Lima, Perú")'),
    coordinates: z.object({
        lat: z.number().describe('Latitud'),
        lon: z.number().describe('Longitud'),
    }),
    date: z.string().describe('Fecha de la consulta en formato ISO (por ejemplo, "2023-10-01")'),
    tempHigh: z.number().describe('Temperatura máxima en °C'),
    tempLow: z.number().describe('Temperatura mínima en °C'),
    humidity: z.number().describe('Humedad en porcentaje'),
    windSpeed: z.number().describe('Velocidad del viento en km/h'),
    condition: z.string().describe('Condición climática (por ejemplo, "Despejado", "Lluvia")'),
});

// Esquema de salida para recomendaciones basadas en el clima
const GenerateRecommendationsOutputSchema = z.object({
    recommendations: z.array(z.string()).describe('Recomendaciones basadas en el clima para el agricultor'),
});

// Funcion de exportacion para usar el flujo de recomendaciones basadas en el clima
export async function generateWeatherBasedRecommendations(
    input: z.infer<typeof GenerateRecommendationsInputSchema>
): Promise<z.infer<typeof GenerateRecommendationsOutputSchema>> {
    return generateWeatherBasedRecommendationsFlow(input);
}

// Definición del prompt para Vertex AI
const prompt = ai.definePrompt({
    name: 'generateWeatherBasedRecommendationsPrompt',
    input: {schema: GenerateRecommendationsInputSchema},
    output: {schema: GenerateRecommendationsOutputSchema},
    prompt: `Eres un asistente experto en agronomía especializado en cultivos y condiciones agrícolas de Perú.
Tu objetivo es proporcionar recomendaciones agrícolas personalizadas basadas en los datos climáticos proporcionados.
Siempre debes responder en español, utilizando un lenguaje claro y directo adaptado al contexto local. El usuario es un agricultor peruano que busca mejorar sus prácticas agrícolas.
Utiliza la siguiente información para generar recomendaciones prácticas y adaptadas a las condiciones climáticas y locales actuales:

Datos climáticos y ubicación:
- Ubicación: {{{location}}}
- Coordenadas: Latitud: {{{coordinates.lat}}}, Longitud: {{{coordinates.lon}}}
- Fecha: {{{date}}}
- Temperatura máxima: {{{tempHigh}}}°C
- Temperatura mínima: {{{tempLow}}}°C
- Humedad: {{{humidity}}}%
- Velocidad del viento: {{{windSpeed}}} km/h
- Condición climática: {{{condition}}}

Proporciona recomendaciones sobre:
- Riego: ¿Es necesario regar? ¿Con qué frecuencia?
- Labranza: ¿Es un buen momento para labrar la tierra?
- Aplicación de fertilizantes: ¿Qué tipo de fertilizante se recomienda?
- Siembra: ¿Es un buen momento para sembrar? ¿Qué cultivos son adecuados para estas condiciones?

Asegura que las recomendaciones sean prácticas, ecológicas y adaptadas a la agricultura peruana.
El formato de salida debe ser un arreglo de strings con las recomendaciones.
`,
});

// Definición del flujo que usa el prompt
const generateWeatherBasedRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateRecommendationsFlow',
    inputSchema: GenerateRecommendationsInputSchema,
    outputSchema: GenerateRecommendationsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);