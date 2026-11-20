import { useEffect, useRef, useState } from 'preact/hooks';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Skeleton } from './ui/skeleton';

import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

export const MapSkeleton = ({ width = "100%", height = "610px" }: { width?: string; height?: string }) => (
  <div className="md:pl-4 animate-pulse" style={{ width, height }}>
    <Skeleton className="w-full h-full rounded-md" />
  </div>
);

interface MapProps {
  latitude?: number;
  longitude?: number;
  width?: string;
  height?: string;
  onCoordinatesChange?: (lat: number, lng: number) => void; // Callback for external coordinates
}

const EmbeddedMap: preact.FunctionalComponent<MapProps> = ({
  latitude = 40.7128,
  longitude = -74.0060,
  width = "100%",
  height = "610px",
  onCoordinatesChange,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [zoomLevel, setZoomLevel] = useState(13);

  useEffect(() => {
    if (!mapRef.current) return;

    // Fix default marker icon paths for Vite/bundler (otherwise icons are 404)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: markerIconUrl,
      iconRetinaUrl: markerIconRetinaUrl,
      shadowUrl: markerShadowUrl,
    });

    // Initialize map
    const map = L.map(mapRef.current).setView([latitude, longitude], zoomLevel);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add marker and store reference
    const marker = L.marker([latitude, longitude]).addTo(map)
      .bindPopup('Location')
      .openPopup();

    markerRef.current = marker; // Store the marker reference

    // Click handler to get coordinates
    const handleClick = (e: any) => {
      const { lat, lng } = e.latlng;

      // Update marker position
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.getPopup().setContent(`Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        markerRef.current.openPopup();
      }

      // map.setView([lat, lng], zoomLevel);

      // Pass coordinates to external handler if provided
      if (onCoordinatesChange) {
        onCoordinatesChange(lat, lng);
      }
    };

    // Zoom change handler
    const handleZoom = () => {
      const currentZoom = map.getZoom();
      setZoomLevel(currentZoom);
    };

    // Add event listeners
    map.on('click', handleClick);
    map.on('zoomend', handleZoom); // Trigger when zoom ends

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, [latitude, longitude]);

  return (
    <div className="md:pl-4" style={{ width, height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export { EmbeddedMap };