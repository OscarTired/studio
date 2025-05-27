
"use client";

import type { DiagnoseCropDiseaseInput, DiagnoseCropDiseaseOutput } from "@/ai/flows/diagnose-crop-disease";
import { diagnoseCropDisease } from "@/ai/flows/diagnose-crop-disease";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, Info, CheckCircle, AlertTriangle, Thermometer, ShieldCheck, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Esquema de validación del formulario en español
const diagnosisFormSchema = z.object({
  cropType: z.string().min(2, { message: "El tipo de cultivo debe tener al menos 2 caracteres." }),
  fieldConditions: z.string().optional(),
  cropImage: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Por favor, suba una imagen.")
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, `El tamaño máximo del archivo es 5MB.`)
    .refine(
      (files) => ["image/jpeg", "image/png", "image/webp"].includes(files?.[0]?.type),
      "Se aceptan archivos .jpg, .png y .webp."
    ),
});

type DiagnosisFormValues = z.infer<typeof diagnosisFormSchema>;

export function DiagnosisClientPage() {
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnoseCropDiseaseOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisFormSchema),
    defaultValues: {
      cropType: "",
      fieldConditions: "",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const onSubmit: SubmitHandler<DiagnosisFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setDiagnosisResult(null);

    const file = data.cropImage[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const imageDataUri = reader.result as string;
        const input: DiagnoseCropDiseaseInput = {
          cropImage: imageDataUri,
          cropType: data.cropType,
          fieldConditions: data.fieldConditions,
        };
        const result = await diagnoseCropDisease(input);
        setDiagnosisResult(result);
        toast({
          title: "Diagnóstico Completo",
          description: "La Inteligencia Artificial ha analizado su imagen del cultivo.",
          variant: "default",
        });
      } catch (err) {
        console.error("Error en el diagnóstico:", err);
        const errorMessage = err instanceof Error ? err.message : "Ocurrió un error desconocido durante el diagnóstico.";
        setError(errorMessage);
        toast({
          title: "Error en el Diagnóstico",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-xl overflow-hidden"> {/* Nueva Card para el formulario */}
        <CardHeader className="bg-gradient-to-br from-primary to-accent text-primary-foreground p-6">
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-8 h-8" /> Diagnóstico de Cultivos
          </CardTitle>
          <CardDescription className="text-primary-foreground/80 mt-1">
            Utilice nuestra herramienta de Inteligencia Artificial para identificar problemas en sus cultivos.
            Suba una imagen clara y bríndenos algunos detalles.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="cropType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cultivo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Tomate, Maíz, Papa" {...field} />
                    </FormControl>
                    <FormDescription>
                      Especifique el tipo de cultivo que aparece en la imagen.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fieldConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condiciones del Campo (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ej. Lluvias fuertes recientes, suelo seco, alta humedad" {...field} />
                    </FormControl>
                    <FormDescription>
                      Describa cualquier condición ambiental o del suelo relevante que observe.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cropImage"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Imagen del Cultivo</FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="dropzone-file"
                          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Haga clic para subir</span> o arrastre y suelte
                            </p>
                            <p className="text-xs text-muted-foreground">Formatos aceptados: JPG, PNG, WEBP (Máx. 5MB)</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Asegúrese de que la imagen sea clara y del área afectada.
                            </p>
                          </div>
                          <Input
                            id="dropzone-file"
                            type="file"
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={(e) => {
                              onChange(e.target.files);
                              handleImageChange(e);
                            }}
                            {...rest}
                          />
                        </label>
                      </div>
                    </FormControl>
                    <FormDescription>Suba una imagen clara del cultivo afectado para un mejor diagnóstico.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {imagePreview && (
                <div className="mt-4 text-center"> {/* Centrar el preview */}
                  <h3 className="text-lg font-medium mb-2">Previsualización de la Imagen:</h3>
                  <Image
                    src={imagePreview}
                    alt="Previsualización del cultivo"
                    width={300}
                    height={300}
                    className="rounded-md border object-cover mx-auto" // mx-auto para centrar
                    data-ai-hint="crop plant"
                  />
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Diagnosticando...
                  </>
                ) : (
                  "Diagnosticar Cultivo"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>


      {error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {diagnosisResult && (
        <Card className="mt-8 shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2"><ShieldCheck className="text-primary"/>Resultado del Diagnóstico</CardTitle>
            <CardDescription>Análisis del estado de su cultivo impulsado por Inteligencia Artificial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><Info className="text-accent"/>Enfermedad/Problema Identificado:</h3>
              <p className="text-lg">{diagnosisResult.diseaseName}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><Thermometer className="text-accent"/>Nivel de Confianza:</h3>
              <div className="flex items-center gap-2">
                <Progress value={diagnosisResult.confidence * 100} className="w-full h-3" />
                <span>{(diagnosisResult.confidence * 100).toFixed(0)}%</span>
              (Este porcentaje indica la seguridad de la IA en su diagnóstico.)
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><ListChecks className="text-accent"/>Síntomas Observados:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                {diagnosisResult.symptoms.map((symptom, index) => (
                  <li key={index}>{symptom}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><CheckCircle className="text-accent"/>Recomendaciones para el Manejo:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                {diagnosisResult.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
             <p>Este diagnóstico es una herramienta de apoyo. Para decisiones cruciales, consulte siempre a un agrónomo local.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
