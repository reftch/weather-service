import { CalendarDays } from 'lucide-react';
import { weatherIcons, type City } from '../lib/model';
import { Card, CardHeader, CardTitle } from './ui/card';
import { useEffect, useRef, useState } from 'preact/hooks';

type ForecastPanelProps = React.ComponentProps<"div"> & {
  city: City,
  onCurrentDay: (currentDay: number) => void
}

const ForecastPanel = ({ city, onCurrentDay }: ForecastPanelProps) => {
  const [showWindSpeed, setShowWindSpeed] = useState(true);
  const parentRef = useRef<HTMLDivElement>(null);

  if (!city.daily_forecast || city.daily_forecast.length === 0) {
    return <div>No forecast data available</div>;
  }

  useEffect(() => {
    const checkParentWidth = () => {
      if (parentRef.current) {
        const parentWidth = parentRef.current.offsetWidth;
        // Convert pixels to rems (assuming 1rem = 16px)
        const widthInRems = parentWidth / 16;
        // console.log(widthInRems)
        setShowWindSpeed(widthInRems > 26); // Show if parent is more than 20rem wide
      }
    };

    window.addEventListener('resize', checkParentWidth);
    checkParentWidth();

    return () => window.removeEventListener('resize', checkParentWidth);
  }, []);

  return (
    <Card className="w-full md:max-w-4/10">
      <CardHeader className="flex items-center gap-0 space-y-0 border-b sm:flex-row">
        <div>
          <CardTitle className="flex pt-1 text-xl md:text-2xl items-center">
            <CalendarDays className="mr-1" />10-days Forecast
          </CardTitle>
        </div>
      </CardHeader>
      <div ref={parentRef}>
        <div className="grid mt-2 items-center px-4 pb-4">
          {city.daily_forecast.map((day, index) => {
            // Format the date for display
            const date = new Date(day.time);
            const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
            const monthDay = date.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
            // const dayTitle = index === 0 ? 'Today' : `${dayName} ${monthDay}`;

            return (
              <div
                key={index}
                className="w-full flex flex-row gap-2 items-center justify-start text-left px-5 h-12 w-28 bg-muted mb-1 border-b cursor-pointer hover:bg-primary-foreground"
                onClick={() => onCurrentDay(index)}
              >
                <div className="basis-3/6 font-semibold">
                  <span>{index === 0 ? 'Today' : dayName}</span>
                  {index > 0 ? <span>{monthDay}</span> : null}
                </div>

                {showWindSpeed && (
                  <div className="text-left basis-5/6">
                    <span className="font-semibold">Wind</span> <span>{day.wind_speed_10m_max}</span> km/h
                  </div>
                )}

                <div className="flex items-center space-x-1 text-xl w-min-22 basis-4/6 justify-end">
                  <span className="pr-5 text-2xl">{weatherIcons[day.weather_code as keyof typeof weatherIcons]}</span>
                  <span className="text-chart-2 pr-2 text-base">{Math.round(day.temperature_2m_min)}°</span>
                  <span className="text-blue-600">{Math.round(day.temperature_2m_max)}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card >
  );
};

export { ForecastPanel };