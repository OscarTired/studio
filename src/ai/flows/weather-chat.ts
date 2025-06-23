'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Esquema de entrada para el chat de clima
const WeatherChatInputSchema = z.object({
    message: z.string().describe('Mensaje del usuario'),
    weatherContext: z.object({
        location: z.string().describe('Ubicación del campo'),
        coordinates: z.object({
            lat: z.number().describe('Latitud'),
            lon: z.number().describe('Longitud'),
        }),
        date: z.string().describe('Fecha de la consulta'),
        tempHigh: z.number().describe('Temperatura máxima en °C'),
        tempLow: z.number().describe('Temperatura mínima en °C'),
        humidity: z.number().describe('Humedad en porcentaje'),
        windSpeed: z.number().describe('Velocidad del viento en km/h'),
        condition: z.string().describe('Condición climática'),
        recommendations: z.array(z.string()).describe('Recomendaciones previas generadas'),
    }),
    chatHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']).describe('Rol del mensaje'),
        content: z.string().describe('Contenido del mensaje'),
    })).optional().describe('Historial de conversación'),
});

// Esquema de salida para el chat de clima
const WeatherChatOutputSchema = z.object({
    response: z.string().describe('Respuesta del asistente'),
});

// Definición del prompt para el chat de clima
const prompt = ai.definePrompt({
    name: 'weatherChatPrompt',
    input: {schema: WeatherChatInputSchema},
    output: {schema: WeatherChatOutputSchema},
    prompt: `Eres un asistente agrícola especializado que ayuda a los agricultores con consultas relacionadas al clima y la agricultura.

CONTEXTO CLIMÁTICO ACTUAL:
- Ubicación: {{{weatherContext.location}}}
- Fecha: {{{weatherContext.date}}}
- Temperatura: {{{weatherContext.tempLow}}}°C - {{{weatherContext.tempHigh}}}°C
- Humedad: {{{weatherContext.humidity}}}%
- Viento: {{{weatherContext.windSpeed}}} km/h
- Condiciones: {{{weatherContext.condition}}}

RECOMENDACIONES PREVIAS GENERADAS:
{{#each weatherContext.recommendations}}
- {{this}}
{{/each}}

HISTORIAL DE CONVERSACIÓN:
{{#each chatHistory}}
- {{content}}
{{/each}}

PREGUNTA ACTUAL DEL USUARIO:
{{{message}}}

INSTRUCCIONES:
1. Responde en español de manera clara y profesional
2. Mantén el contexto del clima y las recomendaciones previas
3. Proporciona información práctica y específica para la agricultura
4. Si la pregunta no está relacionada con agricultura o clima, redirige amablemente al tema
5. Usa el contexto climático para dar respuestas más precisas
6. Sé conciso pero informativo
7. Si necesitas más información específica, pregunta al usuario

El formato de salida debe ser un objeto JSON con la clave "response" que contenga tu respuesta.
`,
});

// Flujo principal para el chat de clima
const weatherChatFlow = ai.defineFlow(
    {
        name: 'weatherChatFlow',
        inputSchema: WeatherChatInputSchema,
        outputSchema: WeatherChatOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

// Función exportada para usar en el frontend
export async function generateWeatherChatResponse(
    input: z.infer<typeof WeatherChatInputSchema>
): Promise<z.infer<typeof WeatherChatOutputSchema>> {
    return weatherChatFlow(input);
}

// Exportar tipos para usar en el frontend
export type WeatherChatInput = z.infer<typeof WeatherChatInputSchema>;
export type WeatherChatOutput = z.infer<typeof WeatherChatOutputSchema>;