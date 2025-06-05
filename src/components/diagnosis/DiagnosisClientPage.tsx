
"use client";

import type { DiagnoseCropDiseaseInput, DiagnoseCropDiseaseOutput } from "@/ai/flows/diagnose-crop-disease";
import { diagnoseCropDisease } from "@/ai/flows/diagnose-crop-disease";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UploadCloud, Info, CheckCircle, AlertTriangle, Thermometer, ShieldCheck, ListChecks, Volume2, X, Camera, Play, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Esquema de validación del formulario en español
const diagnosisFormSchema = z.object({
  cropType: z.string().min(2, { message: "El tipo de cultivo debe tener al menos 2 caracteres." }),
  //fieldConditions: z.string().optional(),
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
  const [gettingLocation, setGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingRecommendations, setIsPlayingRecommendations] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisFormSchema),
    defaultValues: {
      cropType: "",
      //*fieldConditions: "",//
    },
  });

// Este useEffect controlará la reproducción automáticamente una vez que el resultado esté disponible
  useEffect(() => {
    if (diagnosisResult?.audioContentBase64) {
      const audioSource = `data:audio/mpeg;base64,${diagnosisResult.audioContentBase64}`;
      if (audioRef.current) {
        audioRef.current.src = audioSource;
        audioRef.current.load(); // Carga la nueva fuente
        audioRef.current.play().catch(e => console.error("Error al intentar reproducir el audio automáticamente:", e)); // Intenta reproducir
      }
    }
  }, [diagnosisResult]); // Se dispara cuando diagnosisResult cambia

  // Función fallback para geolocalización por IP
  const tryIPGeolocation = async () => {
    try {
      console.log('Intentando geolocalización por IP...');
      
      // Usar ipapi.co que es gratuito y no requiere API key
      const response = await fetch('https://ipapi.co/json/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        console.log('Ubicación obtenida por IP:', {
          lat: data.latitude,
          lon: data.longitude,
          city: data.city,
          country: data.country_name
        });
        
        setLocation({ lat: data.latitude, lon: data.longitude });
        setGettingLocation(false);
        setError("");
        toast({
          title: "Ubicación Aproximada Obtenida",
          description: `Ubicación basada en IP: ${data.city}, ${data.country_name}`,
          variant: "default",
        });
      } else {
        throw new Error('No se pudieron obtener coordenadas válidas');
      }
    } catch (ipError) {
      console.error('Error en geolocalización por IP:', ipError);
      
      // Si también falla la geolocalización por IP, mostrar error final
      const errorMessage = "No se pudo obtener la ubicación ni por GPS ni por IP. Verifica tu conexión a internet.";
      setError(errorMessage);
      setGettingLocation(false);
      toast({
        title: "Error de Ubicación",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Función para obtener la ubicación del usuario
  const handleGetLocation = () => {
    console.log('Iniciando solicitud de geolocalización...');
    console.log('Navegador:', navigator.userAgent);
    console.log('HTTPS:', window.location.protocol === 'https:');
    console.log('Localhost:', window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    if (!navigator.geolocation) {
      const errorMsg = "La geolocalización no es compatible con este navegador.";
      console.error(errorMsg);
      setError(errorMsg);
      setGettingLocation(false);
      toast({
        title: "Error de Geolocalización",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Verificar permisos antes de solicitar ubicación
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        console.log('Estado de permisos de geolocalización:', result.state);
        if (result.state === 'denied') {
          const errorMsg = "Los permisos de ubicación están denegados. Por favor, habilítalos en la configuración del navegador.";
          setError(errorMsg);
          setGettingLocation(false);
          toast({
            title: "Permisos Denegados",
            description: errorMsg,
            variant: "destructive",
          });
          return;
        }
      }).catch((err) => {
        console.warn('No se pudo verificar permisos:', err);
      });
    }

    setGettingLocation(true);
    
    const options = {
      enableHighAccuracy: false, // Cambiar a false para mejor compatibilidad
      timeout: 15000, // Aumentar timeout
      maximumAge: 300000, // 5 minutos
    };
    
    console.log('Opciones de geolocalización:', options);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Ubicación obtenida exitosamente:', {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        
        setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        setGettingLocation(false);
        setError(""); // Limpiar errores previos
        toast({
          title: "Ubicación Obtenida",
          description: `Coordenadas: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          variant: "default",
        });
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        
        let errorMessage = "No se pudo obtener la ubicación. ";
        let errorTitle = "Error de Ubicación";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permisos de ubicación denegados. Por favor, habilita los permisos de ubicación en tu navegador.";
            errorTitle = "Permisos Denegados";
            console.error('Permisos de geolocalización denegados por el usuario');
            break;
          case error.POSITION_UNAVAILABLE:
             console.error('Información de ubicación no disponible, intentando con IP geolocation...');
             // Fallback: usar geolocalización por IP
             tryIPGeolocation();
             return; // No mostrar error aún, esperar resultado del fallback
          case error.TIMEOUT:
            errorMessage = "La solicitud de ubicación ha expirado. Por favor, intenta nuevamente.";
            errorTitle = "Tiempo Agotado";
            console.error('Timeout en la solicitud de geolocalización');
            break;
          default:
            errorMessage = `Error desconocido al obtener la ubicación: ${error.message}`;
            console.error('Error desconocido:', error.message);
            break;
        }
        
        setError(errorMessage);
        setGettingLocation(false);
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      },
      options
    );
  };

  // Función para manejar el cambio de imagen
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

  // Función para quitar la imagen
  const handleRemoveImage = () => {
    setImagePreview(null);
    form.setValue('cropImage', undefined as any);
    // Reset the file input
    const fileInput = document.getElementById('dropzone-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Función para reproducir todo el resultado del diagnóstico con texto a voz
  const speakRecommendations = (recommendations: string[]) => {
    if ('speechSynthesis' in window && diagnosisResult) {
      // Detener cualquier síntesis anterior
      window.speechSynthesis.cancel();
      
      // Crear el texto completo del diagnóstico
      let textToSpeak = `Resultado del diagnóstico. `;
      textToSpeak += `Enfermedad o problema identificado: ${diagnosisResult.diseaseName}. `;
      textToSpeak += `Nivel de confianza: ${Math.round(diagnosisResult.confidence * 100)} por ciento. `;
      textToSpeak += `Síntomas observados: ${diagnosisResult.symptoms.join(', ')}. `;
      textToSpeak += `Recomendaciones para el manejo: ${recommendations.join('. ')}.`;
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Configurar la voz en español con prioridad específica
      const voices = window.speechSynthesis.getVoices();
      console.log('Voces disponibles:', voices.map(v => `${v.name} (${v.lang})`));
      
      // Lista de voces preferidas en orden de prioridad
      const preferredVoices = [
        'Microsoft Sabina - Spanish (Mexico)',
        'Microsoft Sabina',
        'Sabina',
        'Microsoft Raul - Spanish (Mexico)',
        'Microsoft Raul',
        'Raul',
        'Google español de México',
        'Google español',
        'Spanish (Mexico)',
        'Spanish (Latin America)',
        'Spanish (Spain)',
        'es-MX',
        'es-ES',
        'es-AR',
        'es-CO',
        'es-CL'
      ];
      
      let selectedVoice = null;
      
      // Buscar por nombre exacto primero
      for (const preferredName of preferredVoices) {
        selectedVoice = voices.find(voice => 
          voice.name === preferredName || 
          voice.name.includes(preferredName)
        );
        if (selectedVoice) {
          console.log(`Voz seleccionada por nombre: ${selectedVoice.name} (${selectedVoice.lang})`);
          break;
        }
      }
      
      // Si no se encuentra por nombre, buscar por código de idioma
      if (!selectedVoice) {
        const spanishLanguageCodes = ['es-MX', 'es-ES', 'es-AR', 'es-CO', 'es-CL', 'es-PE', 'es-VE'];
        for (const langCode of spanishLanguageCodes) {
          selectedVoice = voices.find(voice => voice.lang === langCode);
          if (selectedVoice) {
            console.log(`Voz seleccionada por código de idioma: ${selectedVoice.name} (${selectedVoice.lang})`);
            break;
          }
        }
      }
      
      // Fallback: cualquier voz que empiece con 'es'
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('es'));
        if (selectedVoice) {
          console.log(`Voz seleccionada como fallback: ${selectedVoice.name} (${selectedVoice.lang})`);
        }
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else {
        console.warn('No se encontró ninguna voz en español disponible');
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => {
        setIsPlayingRecommendations(true);
      };
      
      utterance.onend = () => {
        setIsPlayingRecommendations(false);
        setCurrentUtterance(null);
      };
      
      utterance.onerror = (event) => {
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          setError('Error al reproducir el audio del diagnóstico');
        }
        setIsPlayingRecommendations(false);
        setCurrentUtterance(null);
      };
      
      setCurrentUtterance(utterance);
      window.speechSynthesis.speak(utterance);
    } else {
      setError('Tu navegador no soporta la síntesis de voz');
    }
  };

  // Función para detener la reproducción
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingRecommendations(false);
      setCurrentUtterance(null);
    }
  };

  // Función para obtener los datos climáticos actuales desde OpenMeteo
  const fetchOpenMeteoWeather = async (latitude: number, longitude: number): Promise<any> => {
    try {
      // Validar coordenadas
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Coordenadas inválidas');
      }
      const params = new URLSearchParams({
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max,wind_speed_10m_mean',
        timezone: 'auto',
      });

      const url = `https://api.open-meteo.com/v1/forecast?${params}`;
      console.log('Fetching weather from URL:', url);

      const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

      const data = await response.json();
      console.log('Raw API Data:', data);

      // Usar coordenadas como nombre de ubicación
      const locationName = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;

      // Mapear el código de clima a una descripción
      const getWeatherDescription = (code: number) => {
        const descriptions: { [key: number]: string } = {
          0: "Despejado",
          1: "Principalmente despejado",
          2: "Parcialmente nublado",
          3: "Nublado",
          45: "Niebla",
          48: "Niebla con escarcha",
          51: "Llovizna ligera",
          53: "Llovizna moderada",
          55: "Llovizna intensa",
          61: "Lluvia ligera",
          63: "Lluvia moderada",
          65: "Lluvia intensa",
          71: "Nieve ligera",
          73: "Nieve moderada",
          75: "Nieve intensa",
          80: "Chubascos ligeros",
          81: "Chubascos moderados",
          82: "Chubascos intensos",
          95: "Tormenta",
          96: "Tormenta con granizo ligero",
          99: "Tormenta con granizo intenso",
        };
        return descriptions[code] || "Desconocido";
      };

      // Formatear los datos climáticos según la interfaz WeatherData
      const formattedWeatherData = {
        location: locationName,
        coordinates: { lat: latitude, lon: longitude },
        temperature: Math.round(data.current.temperature_2m),
        tempHigh: Math.round(data.daily.temperature_2m_max[0]),
        tempLow: Math.round(data.daily.temperature_2m_min[0]),
        condition: getWeatherDescription(data.current.weather_code),
        humidity: Math.round(data.current.relative_humidity_2m),
        windSpeed: Math.round(data.current.wind_speed_10m * 3.6), // Convertir m/s a km/h
        windSpeedMin: Math.round(data.daily.wind_speed_10m_mean[0] * 3.6),
        windSpeedMax: Math.round(data.daily.wind_speed_10m_max[0] * 3.6),
        icon: () => null, // No se usa en el diagnóstico
      };
      console.log('Formatted Weather Data:', formattedWeatherData); // Debugging log
      return formattedWeatherData;
    } catch (err: any) {
      console.error('Error in fetchOpenMeteoWeather:', err);
      throw new Error(`Error al obtener datos climáticos: ${err.message}`);
    }
  };

// Función para manejar el envío del formulario
  const onSubmit: SubmitHandler<DiagnosisFormValues> = async (data) => {
    if (!location) {
      setError("Por favor, obtén tu ubicación primero.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setDiagnosisResult(null);

    const file = data.cropImage[0];
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const imageDataUri = reader.result as string;

        // Obtener datos climáticos de OpenMeteo
        const weatherData = await fetchOpenMeteoWeather(location.lat, location.lon);
        if (!weatherData?.location || !weatherData?.coordinates) {
          throw new Error('Datos climáticos incompletos recibidos');
        }

        // Preparar el input para el flujo de diagnóstico
        const input: DiagnoseCropDiseaseInput = {
          cropImage: imageDataUri,
          cropType: data.cropType,
          weatherData: {
            location: weatherData.location,
            coordinates: weatherData.coordinates,
            temperature: weatherData.temperature,
            tempHigh: weatherData.tempHigh,
            tempLow: weatherData.tempLow,
            condition: weatherData.condition,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            windSpeedMin: weatherData.windSpeedMin,
            windSpeedMax: weatherData.windSpeedMax,
            icon: weatherData.icon,
        /*const imageDataUri = reader.result as string;
        const input: DiagnoseCropDiseaseInput = {
          cropImage: imageDataUri,
          cropType: data.cropType,
          fieldConditions: data.fieldConditions,*/
        },
        date: new Date().toISOString(), // Fecha actual en formato ISO
      };

        console.log('Input para diagnóstico:', input); // Debugging log

        const result = await diagnoseCropDisease(input);
        setDiagnosisResult(result);
        toast({
          title: "Diagnóstico Completo",
          description: "La Inteligencia Artificial ha analizado su imagen del cultivo.",
          variant: "default",
        });
      } catch (err: any) {
        console.error('Error en el diagnóstico:', err);
        setError(`Error al realizar el diagnóstico: ${err.message}`);
      toast({
        title: "Error en el Diagnóstico",
        description: err.message,
        variant: "destructive",
      });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const audioUrl = diagnosisResult?.audioContentBase64
    ? `data:audio/mpeg;base64,${diagnosisResult.audioContentBase64}`
    : undefined;

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
              {/* Bloque de fieldConditions eliminado */}

              <FormField
                control={form.control}
                name="cropImage"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Imagen del Cultivo</FormLabel>
                    <FormControl>
                      <div className="flex items-center justify-center w-full">
                        {!imagePreview ? (
                          <label
                            htmlFor="dropzone-file"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                              <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground text-center">
                                <span className="font-semibold">Haga clic para subir</span> o arrastre y suelte
                              </p>
                              <p className="text-xs text-muted-foreground text-center px-2">Formatos aceptados: JPG, PNG, WEBP (Máx. 5MB)</p>
                              <p className="text-xs text-muted-foreground mt-1 text-center px-2">
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
                        ) : (
                          <div className="relative w-full h-64 border-2 border-solid border-primary/20 rounded-lg overflow-hidden bg-card">
                            <Image
                              src={imagePreview}
                              alt="Imagen del cultivo seleccionada"
                              fill
                              className="object-cover"
                              data-ai-hint="crop plant"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 px-4">
                              <label
                                htmlFor="dropzone-file-change"
                                className="bg-primary text-primary-foreground px-3 py-2 rounded-md cursor-pointer hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium flex-shrink-0"
                              >
                                <Camera className="w-4 h-4" />
                                <span className="hidden sm:inline">Cambiar</span>
                              </label>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleRemoveImage}
                                className="flex items-center gap-2 flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                                <span className="hidden sm:inline">Quitar</span>
                              </Button>
                            </div>
                            <Input
                              id="dropzone-file-change"
                              type="file"
                              className="hidden"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={(e) => {
                                onChange(e.target.files);
                                handleImageChange(e);
                              }}
                              {...rest}
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>Suba una imagen clara del cultivo afectado para un mejor diagnóstico.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="button" onClick={handleGetLocation} className="w-full">
                Obtener Ubicación
              </Button>

              <Button type="submit" disabled={isLoading || !location} className="w-full">
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
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-2xl flex items-center gap-2"><ShieldCheck className="text-primary"/>Resultado del Diagnóstico</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => speakRecommendations(diagnosisResult.recommendations)}
                  disabled={isPlayingRecommendations}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline">Reproducir</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={stopSpeaking}
                  disabled={!isPlayingRecommendations}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Square className="w-4 h-4" />
                  <span className="hidden sm:inline">Detener</span>
                </Button>
              </div>
            </div>
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
            {audioUrl && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Volume2 className="text-accent" /> Explicación en Audio:
                      </h3>
                      <audio ref={audioRef} controls className="w-full mt-2">
                        <source src={audioUrl} type="audio/mpeg" />
                        Tu navegador no soporta el elemento de audio.
                      </audio>
                      <p className="text-sm text-muted-foreground mt-1">
                        Puedes escuchar el diagnóstico completo aquí.
                      </p>
                    </div>
                  )}      
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
             <p>Este diagnóstico es una herramienta de apoyo. Para decisiones cruciales, consulte siempre a un agrónomo local.</p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
