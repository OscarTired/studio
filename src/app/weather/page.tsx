
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { MapPin, Thermometer, Wind, Droplets, Sun, Cloud, CloudRain, CloudSnow, Zap, Loader2, WifiOff } from "lucide-react";
import Image from "next/image";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: React.ElementType;
  forecast: ForecastEntry[];
}

interface ForecastEntry {
  day: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  icon: React.ElementType;
}

const mockWeatherData: WeatherData = {
  location: "Greenfield Valley",
  temperature: 24,
  condition: "Sunny",
  humidity: 60,
  windSpeed: 15,
  icon: Sun,
  forecast: [
    { day: "Mon", tempHigh: 26, tempLow: 18, condition: "Partly Cloudy", icon: Cloud },
    { day: "Tue", tempHigh: 22, tempLow: 16, condition: "Showers", icon: CloudRain },
    { day: "Wed", tempHigh: 28, tempLow: 20, condition: "Sunny", icon: Sun },
  ],
};


export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDeniedLocation, setUserDeniedLocation] = useState(false);

  useEffect(() => {
    const fetchWeather = async (latitude: number, longitude: number) => {
      setLoading(true);
      setError(null);
      // In a real app, you would fetch from a weather API here
      // e.g., const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=YOUR_API_KEY&units=metric`);
      // For now, we use mock data after a delay.
      setTimeout(() => {
        // This mock data could be enhanced to reflect coords if desired, but for now it's static
        const dynamicMockData = {
            ...mockWeatherData,
            location: `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)} (Mocked)`
        }
        setWeather(dynamicMockData);
        setLoading(false);
      }, 1500);
    };

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
            setUserDeniedLocation(false);
          },
          (err) => {
            console.warn(`Geolocation error: ${err.message}`);
            setError("Could not retrieve location. Displaying default weather data.");
            setUserDeniedLocation(true);
            setWeather(mockWeatherData); // Fallback to default mock data
            setLoading(false);
          }
        );
      } else {
        setError("Geolocation is not supported by this browser. Displaying default weather data.");
        setWeather(mockWeatherData); // Fallback to default mock data
        setLoading(false);
      }
    };

    getLocation();
  }, []);
  
  const getWeatherIcon = (condition: string): React.ElementType => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("sunny") || lowerCondition.includes("clear")) return Sun;
    if (lowerCondition.includes("cloud")) return Cloud;
    if (lowerCondition.includes("rain") || lowerCondition.includes("shower")) return CloudRain;
    if (lowerCondition.includes("snow")) return CloudSnow;
    if (lowerCondition.includes("storm") || lowerCondition.includes("thunder")) return Zap;
    return Cloud; // Default icon
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Fetching weather data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary to-accent text-primary-foreground p-6">
           <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                    <MapPin className="w-7 h-7" /> {weather?.location || "Weather Forecast"}
                </CardTitle>
                <CardDescription className="text-primary-foreground/80 mt-1">
                    {weather ? `Current conditions for your area.` : `Enable location or check connection.`}
                </CardDescription>
            </div>
            {weather && <weather.icon className="w-16 h-16 opacity-80" />}
           </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
        {error && !weather?.location.includes("Mocked") && (
            <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
                <p className="font-bold">Location Error</p>
                <p>{error}</p>
                {userDeniedLocation && <p className="mt-2">Please enable location services in your browser settings for accurate weather.</p>}
            </div>
        )}
        {weather ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <Thermometer className="w-10 h-10 text-destructive mb-2" />
                <p className="text-3xl font-bold">{weather.temperature}°C</p>
                <p className="text-muted-foreground">Temperature</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <Droplets className="w-10 h-10 text-blue-500 mb-2" />
                <p className="text-3xl font-bold">{weather.humidity}%</p>
                <p className="text-muted-foreground">Humidity</p>
              </div>
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <Wind className="w-10 h-10 text-gray-500 mb-2" />
                <p className="text-3xl font-bold">{weather.windSpeed} km/h</p>
                <p className="text-muted-foreground">Wind Speed</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">3-Day Forecast</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {weather.forecast.map((item, index) => {
                  const ItemIcon = getWeatherIcon(item.condition);
                  return (
                    <Card key={index} className="p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col items-center text-center">
                        <p className="font-semibold text-lg">{item.day}</p>
                        <ItemIcon className="w-12 h-12 text-accent my-2" />
                        <p className="text-xl">{item.tempHigh}° / {item.tempLow}°</p>
                        <p className="text-sm text-muted-foreground">{item.condition}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
            <div className="text-center mt-6">
                <Button onClick={() => window.location.reload()}>
                    Refresh Weather
                </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Weather data is illustrative. For actual farming decisions, please consult a professional weather service.
            </p>
          </>
        ) : (
            <div className="flex flex-col items-center justify-center text-center py-10">
                <WifiOff className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Could not load weather data</h3>
                <p className="text-muted-foreground mb-4">Please check your internet connection or location services and try again.</p>
                <Button onClick={() => window.location.reload()}>
                    Try Again
                </Button>
            </div>
        )}
        </CardContent>
      </Card>
      <div className="mt-8 text-center">
        <Image 
            src="https://placehold.co/600x300.png" 
            alt="Weather placeholder" 
            width={600} 
            height={300} 
            className="rounded-lg shadow-md mx-auto data-ai-hint="sky weather""
            data-ai-hint="sky weather"
        />
        <p className="text-sm text-muted-foreground mt-2">Visual representation of typical weather conditions.</p>
      </div>
    </div>
  );
}
