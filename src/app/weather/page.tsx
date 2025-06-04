// Interfaz de usuario para la página de recomendaciones climáticas para agricultores

"use client";

// Importación de componentes y estilos necesarios
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { generateWeatherBasedRecommendations } from "@/ai/flows/weather-based-recommendations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { MapPin, Thermometer, Wind, Droplets, Sun, Cloud, CloudRain, CloudSnow, Zap, Loader2, WifiOff, Search, Calendar, Map, CloudDrizzle, Cloudy, SunMedium, CloudLightning, CloudFog, Snowflake, SunDim, ThermometerSun, ThermometerSnowflake } from "lucide-react";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dynamic from 'next/dynamic';

// Importación del mapa de forma dinámica para evitar problemas de SSR
const MapSelector = dynamic(() => import('../../components/MapSelector'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">Cargando mapa...</div>
});

// Definición de interfaces para los datos del clima y pronóstico
interface WeatherData {
  location: string;
  coordinates: { lat: number; lon: number };
  temperature: number;
  tempHigh: number;
  tempLow: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  windSpeedMin: number;
  windSpeedMax: number;
  icon: React.ElementType;
  forecast: ForecastEntry[];
  date: Date;
}

interface ForecastEntry {
  date: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: React.ElementType;
  humidity: number;
  windSpeed: number;
  windSpeedMin: number;
  windSpeedMax: number;
}

// Funciones para obtener el ícono del clima basado en el mapeo de código de Open-Meteo
const getWeatherIcon = (weatherCode: number): React.ElementType => {
  if (weatherCode === 0) return Sun; // Clear sky
  if (weatherCode === 1) return SunDim; // Mainly clear
  if (weatherCode === 2) return Cloudy; // Partly cloudy
  if (weatherCode === 3) return Cloud; // Overcast
  if (weatherCode >= 45 && weatherCode <= 48) return CloudFog; // Fog
  if (weatherCode >= 51 && weatherCode <= 55) return CloudDrizzle; // Drizzle
  if (weatherCode >= 61 && weatherCode <= 67) return CloudRain; // Rain
  if (weatherCode >= 71 && weatherCode <= 86) return CloudSnow; // Snow
  if (weatherCode === 95) return CloudLightning; // Thunderstorm
  if (weatherCode === 96) return Snowflake; // Thunderstorm with light hail
  if (weatherCode === 99) return CloudLightning; // Thunderstorm with heavy hail
  return Cloud; // Default
};

// Función para obtener la descripción del clima basada en el mapeo de código de Open-Meteo (en español)
const getWeatherDescription = (weatherCode: number): string => {
  const codes: { [key: number]: string } = {
    0: "Cielo despejado",
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
    95: "Tormenta eléctrica",
    96: "Tormenta con granizo ligero",
    99: "Tormenta con granizo intenso"
  };
  return codes[weatherCode] || "Condiciones desconocidas";
};

// Función para obtener el ícono del termómetro basado en la temperatura promedio (tempLow y tempHigh)
const getThermometerIcon = (tempLow: number, tempHigh: number): { icon: React.ElementType; color: string } => {
  const avgTemp = (tempLow + tempHigh) / 2;
  
  if (avgTemp <= 0) {
    return { icon: ThermometerSnowflake, color: "text-blue-600" };
  } else if (avgTemp <= 10) {
    return { icon: ThermometerSnowflake, color: "text-blue-400" };
  } else if (avgTemp <= 20) {
    return { icon: Thermometer, color: "text-green-500" };
  } else if (avgTemp <= 30) {
    return { icon: ThermometerSun, color: "text-orange-500" };
  } else {
    return { icon: ThermometerSun, color: "text-red-600" };
  }
};

// Estados para manejar el clima y la ubicación
export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  // Estados para recomendaciones
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Estados para selección manual de ubicación
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [manualLocation, setManualLocation] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);
  
  // Estados para selección de fecha
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Función para obtener datos clima usando Open-Meteo API
  const fetchOpenMeteoWeather = async (latitude: number, longitude: number, targetDate?: Date) => {
    setLoading(true);
    setError(null);
    setGettingLocation(false);

    try {
      // Validar coordenadas
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Coordenadas inválidas');
      }

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Normalizar a medianoche para comparación
      
      const targetDateNormalized = targetDate ? new Date(targetDate) : new Date();
      targetDateNormalized.setHours(0, 0, 0, 0);
      
      const isHistorical = targetDateNormalized < currentDate;
      const isFuture = targetDateNormalized > currentDate;
      
      let url: string;
      let params = new URLSearchParams({
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,wind_speed_10m_max,wind_speed_10m_mean',
        timezone: 'auto'
      });

      if (isHistorical) {
        // Para datos históricos - usar API de archivo
        const startDate = new Date(targetDateNormalized);
        const endDate = new Date(targetDateNormalized);
        endDate.setDate(endDate.getDate() + 6); // 7 días total incluyendo el día inicial
        
        // Validar que la fecha histórica no sea muy antigua (Open-Meteo tiene límites)
        const minDate = new Date('2022-01-01');
        if (startDate < minDate) {
          throw new Error('Los datos históricos solo están disponibles desde enero de 2022');
        }
        
        params.append('start_date', startDate.toISOString().split('T')[0]);
        params.append('end_date', endDate.toISOString().split('T')[0]);
        url = `https://archive-api.open-meteo.com/v1/archive?${params}`;
      } else {
        // Para datos actuales y futuros
        if (isFuture) {
          // Validar que la fecha futura no sea muy lejana
          const maxFutureDate = new Date();
          maxFutureDate.setDate(maxFutureDate.getDate() + 14);
          if (targetDateNormalized > maxFutureDate) {
            throw new Error('Solo se pueden consultar pronósticos hasta 14 días en el futuro');
          }
          params.append('forecast_days', '14');
        } else {
          params.append('forecast_days', '7');
        }
        url = `https://api.open-meteo.com/v1/forecast?${params}`;
      }

      console.log("Fetching weather from URL:", url);

      const response = await fetch(url);
      if (!response.ok) {
        let errorMessage = `Error HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.reason) {
            errorMessage += `: ${errorData.reason}`;
          }
        } catch {
          // Si no se puede parsear el error, usar mensaje genérico
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Raw API Data:", data);

      // Validar que la respuesta tenga los datos esperados
      if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
        throw new Error('No se recibieron datos válidos del clima');
      }

      // Obtener nombre de la ubicación usando geocoding reverso
      let locationName = `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`;
      try {
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${latitude.toFixed(4)},${longitude.toFixed(4)}&count=1&language=es&format=json`
        );
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.results && geoData.results.length > 0) {
            const result = geoData.results[0];
            locationName = `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}${result.country ? ', ' + result.country : ''}`;
          }
        }
      } catch (geoError) {
        console.log("Could not fetch location name:", geoError);
      }

      // Encontrar el índice correcto para la fecha objetivo
      let targetDayIndex = 0;
      if (targetDate) {
        const targetDateStr = targetDateNormalized.toISOString().split('T')[0];
        targetDayIndex = data.daily.time.findIndex((dateStr: string) => dateStr === targetDateStr);
        if (targetDayIndex === -1) {
          targetDayIndex = 0; // Fallback al primer día si no se encuentra
        }
      }

      const formattedWeatherData: WeatherData = {
        location: locationName,
        coordinates: { lat: latitude, lon: longitude },
        temperature: Math.round(isHistorical || targetDate ? data.daily.temperature_2m_max[targetDayIndex] : (data.current?.temperature_2m || data.daily.temperature_2m_max[targetDayIndex])),
        tempHigh: Math.round(data.daily.temperature_2m_max[targetDayIndex]),
        tempLow: Math.round(data.daily.temperature_2m_min[targetDayIndex]),
        condition: getWeatherDescription(isHistorical || targetDate ? data.daily.weather_code[targetDayIndex] : (data.current?.weather_code || data.daily.weather_code[targetDayIndex])),
        humidity: Math.round(isHistorical || targetDate ? data.daily.relative_humidity_2m_mean[targetDayIndex] : (data.current?.relative_humidity_2m || data.daily.relative_humidity_2m_mean[targetDayIndex])),
        windSpeed: Math.round((isHistorical || targetDate ? data.daily.wind_speed_10m_max[targetDayIndex] : (data.current?.wind_speed_10m || data.daily.wind_speed_10m_max[targetDayIndex])) * 3.6), // Convert m/s to km/h
        windSpeedMin: Math.round(data.daily.wind_speed_10m_mean[targetDayIndex] * 3.6), // Convert m/s to km/h
        windSpeedMax: Math.round(data.daily.wind_speed_10m_max[targetDayIndex] * 3.6), // Convert m/s to km/h
        icon: getWeatherIcon(isHistorical || targetDate ? data.daily.weather_code[targetDayIndex] : (data.current?.weather_code || data.daily.weather_code[targetDayIndex])),
        date: targetDate || currentDate,
        forecast: data.daily.time.slice(1, 8).map((dateStr: string, index: number) => {
          const forecastDate = new Date(dateStr);
          return {
            date: forecastDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
            tempHigh: Math.round(data.daily.temperature_2m_max[index + 1]),
            tempLow: Math.round(data.daily.temperature_2m_min[index + 1]),
            condition: getWeatherDescription(data.daily.weather_code[index + 1]),
            icon: getWeatherIcon(data.daily.weather_code[index + 1]),
            humidity: Math.round(data.daily.relative_humidity_2m_mean[index + 1]),
            windSpeed: Math.round(data.daily.wind_speed_10m_max[index + 1] * 3.6),
            windSpeedMin: Math.round(data.daily.wind_speed_10m_mean[index + 1] * 3.6),
            windSpeedMax: Math.round(data.daily.wind_speed_10m_max[index + 1] * 3.6),
          };
        }),
      };

      setWeather(formattedWeatherData);
      setLoading(false);
      console.log("Conjunto de datos ordenados correctamente:", formattedWeatherData);

    await fetchRecommendations(formattedWeatherData);
    } catch (err: any) {
      console.error("Error en la extracción de datos:", err);
      setError(`Error al obtener datos del clima: ${err.message}`);
      setLoading(false);
    }
  };

  // Función para obtener recomendaciones basadas en el clima usando el flujo de AI
  const fetchRecommendations = async (weatherData: WeatherData) => {
    setLoadingRecommendations(true);
    setError(null);

    try {
      const input = {
        location: weatherData.location,
        coordinates: weatherData.coordinates,
        date: weatherData.date.toISOString(),
        tempHigh: weatherData.tempHigh,
        tempLow: weatherData.tempLow,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        condition: weatherData.condition,
      };

      const result = await generateWeatherBasedRecommendations(input);
      setRecommendations(result.recommendations);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError("Error al obtener recomendaciones agrícolas.");
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Función para manejar la obtención de ubicación actual desde el navegador
  const handleGetLocationClick = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Éxito
          console.log('Ubicación obtenida:', position.coords);
          fetchOpenMeteoWeather(
            position.coords.latitude, 
            position.coords.longitude, 
            selectedDate
          );
        },
        (error) => {
          let mensaje = '';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              mensaje = "Permisos de ubicación denegados. Por favor, habilita los permisos en tu navegador.";
              break;
            case error.POSITION_UNAVAILABLE:
              mensaje = "Información de ubicación no disponible. Verifica tu conexión y servicios de ubicación.";
              break;
            case error.TIMEOUT:
              mensaje = "Tiempo de espera agotado. Intenta nuevamente.";
              break;
            default:
              mensaje = "Error desconocido al obtener ubicación.";
              break;
          }
          console.error('Error de geolocalización:', mensaje);
          setError(mensaje);
          setGettingLocation(false);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setError("La geolocalización no es compatible con este navegador.");
      setGettingLocation(false);
      setLoading(false);
    }
  };

  // Función para manejar la búsqueda manual de ubicación
  const handleManualLocationSearch = async () => {
    if (!manualLocation.trim()) return;
    
    setLoading(true);
    setError(null);

    try {
      // Buscar ubicación usando Open-Meteo Geocoding API
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualLocation)}&count=1&language=es&format=json`
      );
      
      if (!response.ok) {
        throw new Error('Error al buscar la ubicación');
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        throw new Error('No se encontró la ubicación. Intenta con otro nombre.');
      }
      
      const location = data.results[0];
      await fetchOpenMeteoWeather(location.latitude, location.longitude, selectedDate);
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Función para manejar la selección de ubicación en el mapa
  const handleMapLocationSelect = (coords: { lat: number; lon: number }) => {
    setSelectedCoords(coords);
    setShowMapSelector(false);
    fetchOpenMeteoWeather(coords.lat, coords.lon, selectedDate);
  };

  // Manejar el cambio de fecha en el selector
  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      setShowDatePicker(false);
      
      // Si ya tenemos coordenadas, volver a buscar con la nueva fecha
      if (weather?.coordinates) {
        fetchOpenMeteoWeather(weather.coordinates.lat, weather.coordinates.lon, date);
      }
    }
  };

  // Bloque condicional para mostrar el estado de carga
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Obteniendo datos del clima...</p>
      </div>
    );
  }

  // Renderizar la interfaz de usuario con los datos del clima y las recomendaciones
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Panel de controles */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Análisis Climático
          </CardTitle>
          <CardDescription>
            Selecciona una ubicación y fecha para ver el pronóstico del clima
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selección de fecha */}
          <div className="space-y-2">
            <Label htmlFor="date-selector">Fecha de consulta</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {selectedDate.toLocaleDateString('es-ES')}
              </Button>
              {showDatePicker && (
                <div className="absolute z-10 bg-white border rounded-lg shadow-lg">
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    minDate={new Date(2020, 0, 1)} // Desde 2020
                    maxDate={new Date(Date.now() + 16 * 24 * 60 * 60 * 1000)} // Hasta 16 días en el futuro
                    inline
                    locale="es"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Opciones de ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ubicación actual (GPS) */}
            <Button
              onClick={handleGetLocationClick}
              disabled={gettingLocation}
              className="flex items-center gap-2 h-auto py-4"
            >
              <MapPin className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">
                  {gettingLocation ? "Obteniendo ubicación..." : "Mi ubicación"}
                </div>
                <div className="text-xs opacity-80">Usar GPS</div>
              </div>
            </Button>

            {/* Búsqueda manual por nombre de ciudad*/}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: Lima, Perú"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLocationSearch()}
                />
                <Button onClick={handleManualLocationSearch} size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Selección en mapa */}
            <Button
              variant="outline"
              onClick={() => setShowMapSelector(true)}
              className="flex items-center gap-2 h-auto py-4"
            >
              <Map className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Seleccionar en mapa</div>
                <div className="text-xs opacity-80">Click en ubicación</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selector de mapa en modal */}
      {showMapSelector && (
        <div className="fixed top-[-25] left-0 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[50] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-5xl max-h-[90vh] mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Selecciona una ubicación</h3>
              <Button 
                variant="outline" 
                onClick={() => setShowMapSelector(false)}
                className="hover:bg-gray-100"
              >
                Cerrar
              </Button>
            </div>
            <div className="h-[500px] w-full">
              <MapSelector onLocationSelect={handleMapLocationSelect} />
            </div>
          </div>
        </div>
      )}

      {/* Mostrar error */}
      {error && (
        <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-md">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Datos del clima */}
      {weather ? (
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary to-accent text-primary-foreground p-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <MapPin className="w-7 h-7" />
                  {weather.location}
                </CardTitle>
                <CardDescription className="text-primary-foreground/80 mt-1">
                  {weather.date.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </div>
              <weather.icon className="w-16 h-16 opacity-80" />
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-8">
            {/* Condiciones actuales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                {(() => {
                  const { icon: ThermometerIcon, color } = getThermometerIcon(weather.tempLow, weather.tempHigh);
                  return <ThermometerIcon className={`w-10 h-10 ${color} mb-2`} />;
                })()}
                <p className="text-3xl font-bold">{weather.tempLow}°C - {weather.tempHigh}°C</p>
                <p className="text-muted-foreground">Temperatura</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <Droplets className="w-10 h-10 text-blue-500 mb-2" />
                <p className="text-3xl font-bold">{weather.humidity}%</p>
                <p className="text-muted-foreground">Humedad</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <Wind className="w-10 h-10 text-gray-500 mb-2" />
                <p className="text-3xl font-bold">{weather.windSpeedMin} - {weather.windSpeedMax} km/h</p>
                <p className="text-muted-foreground">Viento</p>
              </div>
            </div>

            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <p className="text-lg font-medium">{weather.condition}</p>
            </div>

            {/* Pronóstico de 7 días */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Pronóstico de 7 días</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {weather.forecast.map((item, index) => {
                  const ItemIcon = item.icon;
                  return (
                    <Card key={index} className="p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <p className="font-semibold text-sm">{item.date}</p>
                        <ItemIcon className="w-10 h-10 text-accent" />
                        <p className="text-lg font-bold">{item.tempHigh}° / {item.tempLow}°</p>
                        <p className="text-xs text-muted-foreground">{item.condition}</p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{item.humidity}% hum</span>
                          <span>{item.windSpeedMin} - {item.windSpeedMax} km/h</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
            {/* Nueva sección para recomendaciones agrícolas */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Recomendaciones Agrícolas</h3>
              {loadingRecommendations ? (
                <p>Cargando recomendaciones...</p>
              ) : recommendations ? (
                <ul className="list-disc pl-5 space-y-2">
                  {recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              ) : (
                <p>No hay recomendaciones disponibles.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="flex flex-col items-center justify-center text-center py-16">
            <WifiOff className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sin datos del clima</h3>
            <p className="text-muted-foreground">
              Selecciona una ubicación para cargar los datos del clima
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mensaje de aviso */}
      <p className="text-xs text-muted-foreground text-center">
        Los datos climáticos son ilustrativos. Para decisiones agrícolas reales, consulta un servicio meteorológico profesional.
        <br />
        Powered by Open-Meteo API
      </p>
    </div>
  );
}