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
      "A photo of a crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  cropType: z.string().describe('The type of crop in the image.'),
  fieldConditions: z
    .string()
    .optional()
    .describe('Description of the field conditions where the crop is planted.'),
});
export type DiagnoseCropDiseaseInput = z.infer<typeof DiagnoseCropDiseaseInputSchema>;

const DiagnoseCropDiseaseOutputSchema = z.object({
  diseaseName: z.string().describe('The predicted name of the disease or issue.'),
  confidence: z.number().describe('The confidence level of the diagnosis (0-1).'),
  symptoms: z.array(z.string()).describe('Observed symptoms from the image.'),
  recommendations:
    z.array(z.string()).describe('Recommended actions to address the issue.'),
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
  prompt: `You are an expert in plant pathology. Analyze the provided image of the crop and provide a diagnosis, including the disease name, confidence level, observed symptoms, and recommendations for treatment.

Crop Type: {{{cropType}}}
Field Conditions: {{{fieldConditions}}}
Crop Image: {{media url=cropImage}}

Ensure your diagnosis is accurate and actionable for the farmer.
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
