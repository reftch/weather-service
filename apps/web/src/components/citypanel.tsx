import type { City } from '../lib/model';

const CityPanel = ({ city }: { city: City }) => {
  return (
    <div className="w-full">
      <div className="mt-2 space-y-1">
        {Object.entries(city).map(([key, value]) => {
          // Skip nested objects and functions
          if (value === null || value === undefined) return null;

          // Skip the coordinate object itself, we'll handle it separately
          if (key === 'coordinate') return null;

          // Skip current weather object, we'll handle it separately
          if (key === 'current') return null;

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
            // Convert camelCase to space-separated label
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return (
              <div key={key} className="flex justify-between">
                <span className="text-chart-2">{label}:</span>
                <span className="font-medium pl-10">{value}</span>
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