// src/ai/flows/diagnose-crop-disease.ts
'use server';

/**
 * @fileOverview Diagnoses crop diseases or issues based on an image.
 *
 * - diagnoseCropDisease - A function that handles the crop disease diagnosis process.
 * - DiagnoseCropDiseaseInput - The input type for the diagnoseCropDisease function.
 * - DiagnoseCropDiseaseOutput - The return type for the diagnoseCropDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnoseCropDiseaseInputSchema = z.object({
  cropImage: z
    .string()
    .describe(
      "Una foto del cultivo, como una URI de datos que debe incluir un tipo MIME y usar codificación Base64. Formato esperado: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  cropType: z.string().describe('El tipo de cultivo en la imagen, por ejemplo: Maíz, Papa, Quinua.'),
  fieldConditions: z
    .string()
    .optional()
    .describe('Descripción de las condiciones del campo donde el cultivo está sembrado, por ejemplo: sequía, exceso de lluvia, tipo de suelo.'),
});
export type DiagnoseCropDiseaseInput = z.infer<typeof DiagnoseCropDiseaseInputSchema>;

const DiagnoseCropDiseaseOutputSchema = z.object({
  diseaseName: z.string().describe('El nombre predicho de la enfermedad o problema.'),
  confidence: z.number().describe('El nivel de confianza del diagnóstico (0-1).'),
  symptoms: z.array(z.string()).describe('Síntomas observados en la imagen.'),
  recommendations:
    z.array(z.string()).describe('Acciones recomendadas para abordar el problema. Incluir prácticas agrícolas sostenibles y culturalmente relevantes para la región andina.'),
  aiResponseToQuestion: z
  .string()
  .optional()
  .describe('Respuesta natural y útil del asistente de IA a la pregunta específica del agricultor, si la hay. Debe ser en español y adaptada al contexto peruano.'),
});
export type DiagnoseCropDiseaseOutput = z.infer<typeof DiagnoseCropDiseaseOutputSchema>;

export async function diagnoseCropDisease(
  input: DiagnoseCropDiseaseInput
): Promise<DiagnoseCropDiseaseOutput> {
  return diagnoseCropDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseCropDiseasePrompt',
  input: {schema: DiagnoseCropDiseaseInputSchema},
  output: {schema: DiagnoseCropDiseaseOutputSchema},
  prompt: `Eres un asistente experto en agronomía, especializado en cultivos y condiciones agrícolas de Perú.
Tu objetivo principal es ayudar a los agricultores peruanos a diagnosticar problemas en sus cultivos y ofrecerles soluciones prácticas.
Siempre debes responder en **español**, utilizando un lenguaje claro, sencillo y directo, adaptado al contexto y vocabulario local si es posible.

Analiza la siguiente imagen del cultivo y la información proporcionada.
Si el agricultor ha hecho una pregunta, respóndele de manera natural y útil, además de proporcionar el diagnóstico estructurado.

Información del Cultivo:
Tipo de Cultivo: {{{cropType}}}
Condiciones del Campo: {{{fieldConditions}}}
Pregunta del Agricultor: {{{farmerQuestion}}}

Imagen del Cultivo: {{media url=cropImage}}

El formato de salida debe ser estrictamente JSON, incluyendo las siguientes claves:
- "diseaseName": El nombre de la enfermedad o problema detectado.
- "confidence": El nivel de confianza del diagnóstico (un número entre 0.0 y 1.0).
- "symptoms": Un arreglo de strings con los síntomas observados en la imagen.
- "recommendations": Un arreglo de strings con las acciones recomendadas para el manejo del problema. Prioriza recomendaciones prácticas, ecológicas y adaptadas a la agricultura peruana, si es posible.
- "aiResponseToQuestion": Tu respuesta natural y útil a la "Pregunta del Agricultor", si se proporcionó una. Si no hay pregunta, este campo debe estar vacío o nulo.

Asegura que tu diagnóstico sea preciso y que las recomendaciones sean claras y aplicables para el agricultor.
`,
});

const diagnoseCropDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnoseCropDiseaseFlow',
    inputSchema: DiagnoseCropDiseaseInputSchema,
    outputSchema: DiagnoseCropDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
