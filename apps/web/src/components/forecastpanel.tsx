import { CalendarDays } from 'lucide-react';
import { weatherIcons, type City } from '../lib/model';
import { Card, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useEffect, useRef, useState } from 'preact/hooks';

export const ForecastPanelSkeleton = () => (
  <Card className="w-full md:max-w-4/10">
    <CardHeader className="flex items-center gap-0 space-y-0 border-b sm:flex-row">
      <Skeleton className="h-6 w-40" />
    </CardHeader>
    <div className="grid mt-2 items-center px-4 pb-4 gap-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] gap-2 items-center px-5 h-12 bg-muted rounded-md">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24 hidden sm:block" />
          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-6 w-7 rounded-full" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      ))}
    </div>
  </Card>
);

type ForecastPanelProps = React.ComponentProps<"div"> & {
  city: City,
  onCurrentDay: (currentDay: number) => void
}

const ForecastPanel = ({ city, onCurrentDay }: ForecastPanelProps) => {
  const [showWindSpeed, setShowWindSpeed] = useState(true);
  const parentRef = useRef<HTMLDivElement>(null);

  if (!city.daily_forecast || city.daily_forecast.length === 0) {
    if (city.city === 'Loading...') return <ForecastPanelSkeleton />;
    return <div className="w-full md:max-w-4/10 p-8 text-center text-muted-foreground">No forecast data available</div>;
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
                className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] gap-2 items-center px-5 h-12 bg-muted mb-1 border-b cursor-pointer hover:bg-primary-foreground"
                onClick={() => onCurrentDay(index)}
              >
                <div className="font-semibold whitespace-nowrap">
                  <span>{index === 0 ? 'Today' : dayName}</span>
                  {index > 0 ? <span className="ml-1 text-muted-foreground">{monthDay}</span> : null}
                </div>

                <div className="min-w-0 truncate text-left">
                  {showWindSpeed && (
                    <>
                      <span className="font-semibold">Wind</span> <span>{day.wind_speed_10m_max}</span> km/h
                    </>
                  )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 text-xl tabular-nums">
                  <span className="w-7 shrink-0 text-center text-2xl">{weatherIcons[day.weather_code as keyof typeof weatherIcons]}</span>
                  <span className="w-8 shrink-0 text-right text-base text-chart-2">{Math.round(day.temperature_2m_min)}°</span>
                  <span className="w-8 shrink-0 text-right text-blue-600">{Math.round(day.temperature_2m_max)}°</span>
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