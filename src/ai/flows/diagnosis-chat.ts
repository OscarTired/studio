import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Esquema de entrada para el chat de diagnóstico
const DiagnosisChatInputSchema = z.object({
    message: z.string().describe('Mensaje del usuario'),
    diagnosisContext: z.object({
        cropType: z.string().describe('Tipo de cultivo'),
        diseaseName: z.string().describe('Enfermedad o problema identificado'),
        confidence: z.number().describe('Nivel de confianza del diagnóstico'),
        symptoms: z.array(z.string()).describe('Síntomas observados'),
        recommendations: z.array(z.string()).describe('Recomendaciones de manejo'),
        location: z.string().describe('Ubicación del campo'),
        coordinates: z.object({
            lat: z.number().describe('Latitud'),
            lon: z.number().describe('Longitud'),
        }),
        weatherData: z.object({
            temperature: z.number().describe('Temperatura actual'),
            tempHigh: z.number().describe('Temperatura máxima'),
            tempLow: z.number().describe('Temperatura mínima'),
            humidity: z.number().describe('Humedad en porcentaje'),
            windSpeed: z.number().describe('Velocidad del viento'),
            condition: z.string().describe('Condición climática'),
        }),
        date: z.string().describe('Fecha del diagnóstico'),
    }),
    chatHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']).describe('Rol del mensaje'),
        content: z.string().describe('Contenido del mensaje'),
    })).optional().describe('Historial de conversación'),
});

// Esquema de salida para el chat de diagnóstico
const DiagnosisChatOutputSchema = z.object({
    response: z.string().describe('Respuesta del asistente'),
});

// Definición del prompt para el chat de diagnóstico
const prompt = ai.definePrompt({
    name: 'diagnosisChatPrompt',
    input: {schema: DiagnosisChatInputSchema},
    output: {schema: DiagnosisChatOutputSchema},
    prompt: `Eres un asistente agrícola especializado que ayuda a los agricultores con consultas relacionadas al diagnóstico de enfermedades de cultivos y su manejo.

CONTEXTO DEL DIAGNÓSTICO:
- Tipo de cultivo: {{{diagnosisContext.cropType}}}
- Enfermedad/Problema identificado: {{{diagnosisContext.diseaseName}}}
- Nivel de confianza: {{{diagnosisContext.confidence}}}%
- Ubicación: {{{diagnosisContext.location}}}
- Fecha del diagnóstico: {{{diagnosisContext.date}}}

SÍNTOMAS OBSERVADOS:
{{#each diagnosisContext.symptoms}}
- {{this}}
{{/each}}

RECOMENDACIONES DE MANEJO:
{{#each diagnosisContext.recommendations}}
- {{this}}
{{/each}}

CONDICIONES CLIMÁTICAS ACTUALES:
- Temperatura: {{{diagnosisContext.weatherData.tempLow}}}°C - {{{diagnosisContext.weatherData.tempHigh}}}°C
- Humedad: {{{diagnosisContext.weatherData.humidity}}}%
- Viento: {{{diagnosisContext.weatherData.windSpeed}}} km/h
- Condiciones: {{{diagnosisContext.weatherData.condition}}}

HISTORIAL DE CONVERSACIÓN:
{{#each chatHistory}}
- {{content}}
{{/each}}

PREGUNTA ACTUAL DEL USUARIO:
{{{message}}}

INSTRUCCIONES:
1. Responde en español de manera clara y profesional
2. Mantén el contexto del diagnóstico y las recomendaciones previas
3. Proporciona información práctica y específica para el manejo de la enfermedad identificada
4. Si la pregunta no está relacionada con agricultura, diagnóstico de cultivos o manejo de enfermedades, redirige amablemente al tema
5. Usa el contexto climático para dar respuestas más precisas sobre el desarrollo de la enfermedad
6. Sé conciso pero informativo
7. Si necesitas más información específica sobre el cultivo o la enfermedad, pregunta al usuario
8. Considera las condiciones climáticas actuales en tus recomendaciones
9. Si el usuario pregunta sobre tratamientos, siempre recomienda consultar con un agrónomo local para aplicaciones específicas
10. Puedes sugerir medidas preventivas adicionales basadas en el diagnóstico

El formato de salida debe ser un objeto JSON con la clave "response" que contenga tu respuesta.
`,
});

// Flujo principal para el chat de diagnóstico
const diagnosisChatFlow = ai.defineFlow(
    {
        name: 'diagnosisChatFlow',
        inputSchema: DiagnosisChatInputSchema,
        outputSchema: DiagnosisChatOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        return output!;
    }
);

// Función exportada para usar en el frontend
export async function generateDiagnosisChatResponse(
    input: z.infer<typeof DiagnosisChatInputSchema>
): Promise<z.infer<typeof DiagnosisChatOutputSchema>> {
    return diagnosisChatFlow(input);
}

// Exportar tipos para usar en el frontend
export type DiagnosisChatInput = z.infer<typeof DiagnosisChatInputSchema>;
export type DiagnosisChatOutput = z.infer<typeof DiagnosisChatOutputSchema>;