import { ai } from '@/ai/genkit';
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import { z } from 'zod';

// Esquema de entrada para la herramienta TTS
const TextToSpeechInputSchema = z.object({
  text: z.string().describe('Texto a convertir en voz.'),
  languageCode: z.string().default('es-ES').describe('Código del idioma para la voz (por ejemplo, "es-ES").'),
  ssmlGender: z.enum(['NEUTRAL', 'MALE', 'FEMALE']).default('NEUTRAL').describe('Género de la voz.'),
  voiceName: z.string().optional().describe('Nombre de la voz (ej. "es-ES-Wavenet-A"). Si no se especifica, se elegirá una predeterminada.'),
});

// Esquema de salida para la herramienta TTS
const TextToSpeechOutputSchema = z.object({
  audioContent: z.string().describe('Contenido de audio en formato base64.'),
});

export const textToSpeechTool = ai.defineTool(
  {
    name: 'textToSpeech',
    description: 'Convierte texto a voz usando Google Cloud Text-to-Speech.',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (input) => {
    let client: TextToSpeechClient = new TextToSpeechClient();

    try {
        
      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        console.warn(
          'La variable de entorno GOOGLE_APPLICATION_CREDENTIALS no está configurada. ' +
          'Asegúrate de que apunte a tu archivo JSON de credenciales de cuenta de servicio. ' +
          'La autenticación se intentará a través de otros métodos predeterminados de Google Cloud.'
        );
      }

      // --- CONSTRUCCIÓN DE LA PETICIÓN Y LLAMADA A LA API ---
      const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
        input: { text: input.text },
        voice: {
          languageCode: input.languageCode,
          ssmlGender: protos.google.cloud.texttospeech.v1.SsmlVoiceGender[input.ssmlGender], // Usa el enum
          name: input.voiceName, // Si provided, use it
        },
        audioConfig: {
          audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3, // Usa el enum
        },
      };

      // La desestructuración es correcta, pero el tipo de 'response' puede ser un poco engañoso.
      // TypeScript espera un array que contenga la respuesta como primer elemento.
      // La biblioteca devuelve una promesa de un array.
      const [apiResponse] = await client.synthesizeSpeech(request);

      if (!apiResponse.audioContent) {
        throw new Error('No se generó contenido de audio en la respuesta de TTS.');
      }

      // Convertir el Buffer de audio a base64 para devolverlo
      // `audioContent` es de tipo `Uint8Array` | `string`
      const audioBase64 = Buffer.from(apiResponse.audioContent).toString('base64');

      return {
        audioContent: audioBase64,
      };
    } catch (error: any) { // Capturar el error con tipo 'any' para acceder a 'message'
      console.error('Error al generar voz:', error);
      // Lanzar un error más descriptivo para Genkit
      throw new Error(`Error en la herramienta textToSpeech: ${error.message || 'Error desconocido'}`);
    }
  }
);