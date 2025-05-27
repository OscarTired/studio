
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

const getWeatherIcon = (condition: string): React.ElementType => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes("sunny") || lowerCondition.includes("clear")) return Sun;
  if (lowerCondition.includes("cloud")) return Cloud;
  if (lowerCondition.includes("rain") || lowerCondition.includes("shower")) return CloudRain;
  if (lowerCondition.includes("snow")) return CloudSnow;
  if (lowerCondition.includes("storm") || lowerCondition.includes("thunder")) return Zap;
  return Cloud; // Default icon
};

export default function WeatherPage() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [userDeniedLocation, setUserDeniedLocation] = useState(false);

  useEffect(() => {
    // Removed automatic getLocation on mount
    // getLocation();
    // Set loading to false initially as we wait for GPS button click
    setLoading(false);
  }, []);

  const fetchOpenWeather = async (latitude: number, longitude: number) => {
      setLoading(true);
      setError(null);
      setGettingLocation(false);

      const apiKey = process.env  .NEXT_PUBLIC_OPEN_WEATHER_API_KEY;
      if (!apiKey) {
        setError("OpenWeatherMap API key is not configured.");
        setLoading(false);
        return;
      }

      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

      console.log("Fetching weather from URL:", url);
      console.log("API Key:", apiKey ? "Configured" : "NOT Configured"); 

      try {
        const response = await fetch(url);
        console.log("API Response Status:", response.status);
        if (!response.ok) {
          // Handle HTTP errors
          const errorData = await response.json();
          console.error("HTTP Error Data:", errorData);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        console.log("Raw API Data:", data);

        // Map OpenWeatherMap response to WeatherData interface
        const formattedWeatherData: WeatherData = {
          location: `Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`, // OpenWeatherMap One Call doesn't provide city name directly
          temperature: data.current.temp,
          condition: data.current.weather[0].description,
          humidity: data.current.humidity,
          windSpeed: data.current.wind_speed * 3.6, // Convert m/s to km/h
          icon: getWeatherIcon(data.current.weather[0].description),
          forecast: data.daily.slice(1, 9).map((day: any, index: number) => { // Get 8-day forecast, skipping current day
            const date = new Date(day.dt * 1000);
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return {
              day: days[date.getDay()],
              tempHigh: day.temp.max,
              tempLow: day.temp.min,
              condition: day.weather[0].description,
              icon: getWeatherIcon(day.weather[0].description),
            };
          }),
        };

        setWeather(formattedWeatherData);
        setLoading(false);
        console.log("Weather data set successfully:", formattedWeatherData);

      } catch (err: any) {
        console.error("Caught error in fetchOpenWeather:", err);
        setError(`Failed to fetch weather data. ${err.message || ''}`);
        setLoading(false);
      }
  };

  const handleGetLocationClick = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchOpenWeather(position.coords.latitude, position.coords.longitude);
          setUserDeniedLocation(false);
        },
        (err) => {
          console.warn(`Geolocation error: ${err.message}`);
          setError("Could not retrieve location. Please enable location services.");
          setUserDeniedLocation(true);
          setGettingLocation(false);
          setLoading(false); // Ensure loading is false on error
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setGettingLocation(false);
      setLoading(false); // Ensure loading is false
    }
  };

  // Show loading state specifically when fetching location or weather
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
            <div> {/* Header content container */}
              <CardTitle className="text-3xl font-bold flex items-center gap-2">
                <MapPin className="w-7 h-7" /> {weather?.location || "Weather Forecast"}
                {!weather && ( // Show GPS button only when no specific weather is loaded
 <Button
                    onClick={handleGetLocationClick}
 disabled={gettingLocation}
                    className="ml-4 text-sm"
                  >
                    {gettingLocation ? "Getting Location..." : "Use My Location (GPS)"}
                  </Button>
                )}
              </CardTitle>
              <CardDescription className="text-primary-foreground/80 mt-1">
                {weather ? `Current conditions for ${weather.location}.` : `Get weather data using your location.`}
              </CardDescription>
            </div>
            {weather && <weather.icon className="w-16 h-16 opacity-80" />}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {error && !weather?.location.includes("Mocked") && (
            <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
              <p className="font-bold">Error:</p>
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

              <div className="mt-6">
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
            </>
          ) : ( // Show message/button when no weather data
            <div className="flex flex-col items-center justify-center text-center py-10">
              {error ? <WifiOff className="w-16 h-16 text-muted-foreground mb-4" /> : null}
              <h3 className="text-xl font-semibold mb-2">Could not load weather data</h3>
              <p className="text-muted-foreground mb-4">
                {error || "Please get your location to load weather data."}
              </p>
              {!gettingLocation && !loading && ( // Prevent multiple location clicks while processing
                <Button
                  onClick={handleGetLocationClick}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? "Getting Location..." : "Get Weather Data (GPS)"}
                </Button>
              )}
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Weather data is illustrative. For actual farming decisions, please consult a professional weather service.
          </p>
        </CardContent> {/* Close CardContent */}
      </Card> {/* Close Card */}

      {/* Placeholder Image outside the main weather card */}
      <div className="mt-8 text-center">
        <Image
          src="https://placehold.co/600x300.png"
          alt="Weather placeholder"
          width={600}
          height={300}
          className="rounded-lg shadow-md mx-auto"
          data-ai-hint="sky weather"
        />
        <p className="text-sm text-muted-foreground mt-2">Visual representation of typical weather conditions.</p>
      </div>
    </div>
  );
}
