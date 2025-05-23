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

const diagnosisFormSchema = z.object({
  cropType: z.string().min(2, { message: "Crop type must be at least 2 characters." }),
  fieldConditions: z.string().optional(),
  cropImage: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please upload an image.")
    .refine((files) => files?.[0]?.size <= 5 * 1024 * 1024, `Max file size is 5MB.`)
    .refine(
      (files) => ["image/jpeg", "image/png", "image/webp"].includes(files?.[0]?.type),
      ".jpg, .png, and .webp files are accepted."
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
          title: "Diagnosis Complete",
          description: "The AI has analyzed your crop image.",
          variant: "default",
        });
      } catch (err) {
        console.error("Diagnosis error:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during diagnosis.";
        setError(errorMessage);
        toast({
          title: "Diagnosis Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="cropType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crop Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Tomato, Corn, Wheat" {...field} />
                </FormControl>
                <FormDescription>Specify the type of crop shown in the image.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fieldConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Field Conditions (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Recent heavy rain, dry soil, high humidity" {...field} />
                </FormControl>
                <FormDescription>Describe any relevant environmental conditions.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cropImage"
            render={({ field: { onChange, value, ...rest } }) => (
              <FormItem>
                <FormLabel>Crop Image</FormLabel>
                <FormControl>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="dropzone-file"
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
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
                <FormDescription>Upload a clear image of the affected crop.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {imagePreview && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Image Preview:</h3>
              <Image src={imagePreview} alt="Crop preview" width={300} height={300} className="rounded-md border object-cover data-ai-hint="crop plant" />
            </div>
          )}
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Diagnosing...
              </>
            ) : (
              "Diagnose Crop"
            )}
          </Button>
        </form>
      </Form>

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
            <CardTitle className="text-2xl flex items-center gap-2"><ShieldCheck className="text-primary"/>Diagnosis Result</CardTitle>
            <CardDescription>AI-powered analysis of your crop image.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><Info className="text-accent"/>Disease/Issue:</h3>
              <p className="text-lg">{diagnosisResult.diseaseName}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><Thermometer className="text-accent"/>Confidence:</h3>
              <div className="flex items-center gap-2">
                <Progress value={diagnosisResult.confidence * 100} className="w-full h-3" />
                <span>{(diagnosisResult.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><ListChecks className="text-accent"/>Observed Symptoms:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                {diagnosisResult.symptoms.map((symptom, index) => (
                  <li key={index}>{symptom}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2"><CheckCircle className="text-accent"/>Recommendations:</h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                {diagnosisResult.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
