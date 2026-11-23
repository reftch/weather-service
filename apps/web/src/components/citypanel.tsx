import type { City } from '../lib/model';

const CityPanel = ({ city }: { city: City }) => {
  // Prefer the complete reverse-geocoding payload when available.
  const entries: Array<[string, unknown]> = city.details
    ? Object.entries(city.details)
    : Object.entries(city).filter(([key, value]) => {
      if (value === null || value === undefined) return false;
      if (key === 'coordinate' || key === 'current' || key === 'details') return false;
      return typeof value === 'string' || typeof value === 'number';
    });

  return (
    <div className="w-full">
      <div className="mt-2 space-y-1">
        {entries.map(([key, value]) => {
          // Handle elevation specially (if it's a number)
          if (key === 'elevation' && typeof value === 'number') {
            return (
              <div key={key} className="flex justify-between">
                <span className="text-chart-2">Elevation:</span>
                <span className="font-medium">{value}m</span>
              </div>
            );
          }

          // Handle regular string/number values
          if (typeof value === 'string' || typeof value === 'number') {
            const label = key
              .replace(/_/g, ' ')
              .replace(/\./g, ' ')
              .replace(/([A-Z])/g, ' $1')
              .replace(/\b\w/g, (str) => str.toUpperCase())
              .replace(/\bOsm\b/g, 'OSM')
              .trim();
            return (
              <div key={key} className="flex justify-between gap-6">
                <span className="text-chart-2">{label}:</span>
                <span className="font-medium text-right wrap-break-words">
                  {value}
                </span>
              </div>
            );
          }

          return null;
        })}

        {/* Handle coordinates separately */}
        <div className="flex justify-between">
          <span className="text-chart-2">Coordinates:</span>
          <span className="font-medium pl-5">
            {city.coordinate.latitude.toFixed(6)}, {city.coordinate.longitude.toFixed(6)}
          </span>
        </div>

        {/* Handle weather data separately */}
        {city.current && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-chart-2">Temperature:</span>
              <span className="font-medium">{city.current.temperature_2m}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-chart-2">Time:</span>
              <span className="font-medium">{city.current.time}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default CityPanel;