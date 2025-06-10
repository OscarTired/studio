'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

// Definir tipos para Leaflet
declare global {
  interface Window {
    L: any;
  }
}

interface MapSelectorProps {
  onLocationSelect: (coords: { lat: number; lon: number }) => void;
  initialCenter?: { lat: number; lon: number };
}

const MapSelector: React.FC<MapSelectorProps> = ({
  onLocationSelect,
  initialCenter = { lat: -12.0464, lon: -77.0428 } // Lima, Perú por defecto
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Efecto para redimensionar el mapa cuando el contenedor cambie
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current && isMapReady) {
        setTimeout(() => {
          mapInstanceRef.current.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // También redimensionar cuando el mapa esté listo
    if (isMapReady) {
      handleResize();
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMapReady]);

  useEffect(() => {
    // Cargar Leaflet dinámicamente
    const loadLeaflet = async () => {
      if (!window.L) {
        // Cargar CSS de Leaflet
        const linkElement = document.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(linkElement);

        // Cargar JS de Leaflet
        const scriptElement = document.createElement('script');
        scriptElement.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        scriptElement.onload = () => {
          initMap();
        };
        document.body.appendChild(scriptElement);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = window.L;
      
      // Verificar que el contenedor tenga dimensiones
      const container = mapRef.current;
      if (!container.offsetWidth || !container.offsetHeight) {
        // Si el contenedor no tiene dimensiones, esperar un poco más
        setTimeout(() => initMap(), 100);
        return;
      }
      
      // Crear el mapa sin setView inicial
      const map = L.map(mapRef.current, {
        preferCanvas: true,
        zoomControl: true,
        center: [initialCenter.lat, initialCenter.lon],
        zoom: 6
      });
      
      // Agregar tiles de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Crear marcador personalizado
      const customIcon = L.divIcon({
        html: `<div style="background-color: #ef4444; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                   <path d="M12 2C8.13401 2 5 5.13401 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13401 15.866 2 12 2ZM12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5C13.3807 6.5 14.5 7.61929 14.5 9C14.5 10.3807 13.3807 11.5 12 11.5Z"/>
                 </svg>
               </div>`,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Agregar marcador inicial
      const initialMarker = L.marker([initialCenter.lat, initialCenter.lon], { icon: customIcon })
        .addTo(map);
      
      markerRef.current = initialMarker;
      
      // Manejar clicks en el mapa
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        
        // Mover marcador a la nueva posición
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        
        // Obtener nombre del lugar usando geocoding reverso
        try {
          const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lng}&count=1&language=es&format=json`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              const result = data.results[0];
              const locationName = `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}${result.country ? ', ' + result.country : ''}`;
              setSelectedLocation(locationName);
            } else {
              setSelectedLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          }
        } catch (error) {
          console.error('Error getting location name:', error);
          setSelectedLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
        
        // Llamar callback con las coordenadas
        onLocationSelect({ lat: lat, lon: lng });
      });

      mapInstanceRef.current = map;
      
      // Esperar a que el mapa esté completamente cargado
      map.whenReady(() => {
        setIsMapReady(true);
        
        // Forzar redimensionamiento del mapa después de que esté listo
        setTimeout(() => {
          if (map && map.getContainer()) {
            map.invalidateSize();
          }
        }, 100);
        
        // Redimensionamiento adicional para asegurar que se muestre correctamente
        setTimeout(() => {
          if (map && map.getContainer()) {
            map.invalidateSize();
          }
        }, 500);
      });
    };

    loadLeaflet();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialCenter, onLocationSelect]);

  return (
    <div className="h-full w-full relative overflow-hidden rounded-lg" style={{height: '100%', width: '100%', maxHeight: '100%'}}>
      <div 
        ref={mapRef} 
        className="h-full w-full rounded-lg"
        style={{ height: '100%', width: '100%', minHeight: '300px', maxHeight: '100%' }}
      />
      
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <MapPin className="w-8 h-8 animate-pulse mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500 text-sm">Cargando mapa...</p>
          </div>
        </div>
      )}
      
      {selectedLocation && (
        <div className="absolute top-2 left-2 bg-white px-2 sm:px-3 py-1 sm:py-2 rounded-lg shadow-md border max-w-[calc(100%-1rem)] sm:max-w-xs">
          <p className="text-xs sm:text-sm font-medium text-gray-700">Ubicación seleccionada:</p>
          <p className="text-xs text-gray-600 truncate">{selectedLocation}</p>
        </div>
      )}
      
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs max-w-[calc(100%-1rem)]">
        <span className="hidden sm:inline">Click en el mapa para seleccionar ubicación</span>
        <span className="sm:hidden">Toca para seleccionar</span>
      </div>
    </div>
  );
};

export default MapSelector;