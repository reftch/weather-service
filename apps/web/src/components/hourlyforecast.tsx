import { ChevronDownIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { weatherIcons, type City } from '../lib/model';
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "./ui/popover";
import { Skeleton } from './ui/skeleton';
import CityPanel from './citypanel';
import { useEffect, useRef, useState } from 'react';

export const HourlyForecastSkeleton = () => (
  <Card className="w-full mt-6">
    <CardHeader className="flex items-center gap-0 space-y-0 border-b sm:flex-row">
      <div className="flex-1 pt-1 space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex flex-col text-right space-y-2 items-end">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
    </CardHeader>
    <div className="flex flex-col">
      <div className="flex items-center justify-between mx-5 pb-4">
        <div className="flex mt-2 space-x-2 justify-between items-center w-full overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center pt-2 h-[92px] w-20 bg-muted rounded-md shrink-0 gap-2">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </Card>
);

const getCoordinates = (c: City) => {
  let title = ` ${c.coordinate.latitude.toFixed(2)}, ${c.coordinate.longitude.toFixed(2)}`;

  // console.log(c)
  return (
    <>
      <CardTitle className="text-2xl pt-1">
        <div className="flex">
          <div>{title}</div>
        </div>
      </CardTitle >
      <CardDescription className="pt-2">Elevation: {c.elevation}</CardDescription>
    </>
  )
}

const getTitle = (city: City) => {
  return (
    <>
      <CardTitle className="text-xl md:text-2xl py-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-[230px] md:max-w-lg">
        {city.city}
      </CardTitle>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex whitespace-nowrap -ml-2 pl-2 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 cursor-pointer">
            <span className="hidden sm:block">{city.state ? `${city.state}, ${city.country}` : city.country}</span>
            <span className="sm:hidden">{city.country}</span>
            <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180 p-1" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <PopoverHeader>
            <PopoverTitle>Location Details</PopoverTitle>
            <PopoverDescription className="border-b">
            </PopoverDescription>
          </PopoverHeader>
          <CityPanel city={city} />
        </PopoverContent>
      </Popover>
    </>
  )
}


const HourlyForecastPanel = ({ city, currentDay }: { city: City, currentDay: number }) => {
  if (!city.hourly_forecast || city.hourly_forecast.length === 0) {
    if (city.city === 'Loading...') return <HourlyForecastSkeleton />;
    return <div className="w-full mt-6 p-8 text-center text-muted-foreground">No hourly forecast data available</div>;
  }

  // console.log(currentDay, city.hourly_forecast)

  const offset = 25 - new Date().getHours();

  // Show all 24 hours but with scrolling to display only 10 at a time
  const filteredHours = () => {

    if (city.hourly_forecast) {
      if (0 === currentDay) {
        return city.hourly_forecast.slice(0, 24);
      } else {
        const start = (currentDay - 1) * 24 + offset;
        return city.hourly_forecast.slice(start, start + 24);
      }
    }
    return []
  };

  const getIcon = (hour: any) => {
    let icon;
    if (hour.precipitation_probability >= 35) {
      // if (hour.precipitation_probability >= 35) icon = weatherIcons[51];
      if (hour.precipitation_probability >= 35) icon = weatherIcons[61];
      if (hour.precipitation_probability >= 65) icon = weatherIcons[63];
      if (hour.precipitation_probability >= 75) icon = weatherIcons[63];
      if (hour.precipitation_probability >= 85) icon = weatherIcons[65];
    } else {
      if (hour.cloud_cover <= 25) icon = weatherIcons[0];  // Clear sky
      else if (hour.cloud_cover <= 50) icon = weatherIcons[1];  // Mainly clear
      else if (hour.cloud_cover <= 75) icon = weatherIcons[2];  // Partly cloudy
      else icon = weatherIcons[3];  // Overcast
    }

    return icon;
  }

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScrollButtons = () => {
      if (containerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
      }
    };

    // Initial check
    checkScrollButtons();

    // Add event listeners for scroll and resize events
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);

      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, []);


  const getHourlyDate = (): string => {
    if (currentDay === 0) {
      return 'Today';
    }
    const current = new Date();
    const futureDate = new Date(current);
    futureDate.setDate(current.getDate() + currentDay);
    return futureDate.toLocaleDateString('de-DE');
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader className="flex items-center gap-0 space-y-0 border-b sm:flex-row">
        <div className="flex-1 pt-1">
          {city.city !== 'Loading...' ? getTitle(city) : getCoordinates(city)}
        </div>
        <div className="flex flex-col text-right">
          <div className="flex justify-end items-center text-right">
            <span className="text-4xl pr-4">{weatherIcons[city?.current.weather_code as keyof typeof weatherIcons]}</span>
            <div className="text-4xl">{city?.current.temperature_2m}°</div>
          </div>
          <div className="text-sm md:text-base">
            <span className="pr-2 font-semibold">{getHourlyDate()}</span>
            <span className="pr-0.5 text-ring text-sm">{city.coordinate.latitude.toFixed(2)},</span>
            <span className="text-ring text-sm  ">{city.coordinate.longitude.toFixed(2)}</span>
          </div>
        </div>
      </CardHeader>
      <div className="flex flex-col">
        {/* Scroll buttons container */}
        <div className="flex items-center justify-between mx-5 pb-4 relative group">
          {canScrollLeft && <button
            id="scroll-left"
            className="bg-chart-1 opacity-0 transition-opacity duration-200 absolute left-0 z-10 h-23 mt-2 p-1 group-hover:opacity-50"
            onClick={(e) => {
              e.preventDefault();
              const container = document.querySelector('.hourly-container');
              if (container) {
                container.scrollBy({ left: -1000, behavior: 'smooth' });
              }
            }}
            aria-label="Scroll forecast left"
          >
            <ChevronLeft />
          </button>}

          <div
            ref={containerRef}
            className="flex mt-2 space-x-2 justify-between items-center hourly-container overflow-x-auto whitespace-nowrap w-full"
            style={{
              maxWidth: '100%',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none', // For Firefox
              msOverflowStyle: 'none'  // For IE/Edge
            }}
          >
            {filteredHours().map((hour, index) => {
              // Format the time for display
              let hourString = ''
              if (currentDay === 0) {
                const date = new Date(hour.time);
                hourString = index === 0 ? 'Now' : `${date.getHours().toString()}:00`;
              } else {
                const date = new Date(hour.time);
                hourString = `${date.getHours().toString()}:00`;
              }

              return (
                <div
                  key={index}
                  className="flex flex-col items-center pt-2 h-23 w-20 bg-muted scroll-snap-align-start"
                  style={{
                    flexShrink: 0,
                    marginRight: '0rem'
                  }}
                >
                  <div>
                    <span className="text-sm">{hourString}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-blue-600 text-lg">{Math.round(hour.temperature_2m)}°</span>
                  </div>
                  <div className="flex items-center">
                    <span className="pr-1.5 text-2xl">
                      {getIcon(hour)}
                    </span>
                    <span className="text-xs text-chart-2">{hour.precipitation_probability}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {canScrollRight && <button
            id="scroll-right"
            className="bg-chart-1 opacity-0 transition-opacity duration-200 absolute right-0 z-10 h-23 mt-2 p-1 group-hover:opacity-50"
            onClick={(e) => {
              e.preventDefault();
              const container = document.querySelector('.hourly-container');
              if (container) {
                container.scrollBy({ left: 1000, behavior: 'smooth' });
              }
            }}
            aria-label="Scroll forecast right"
          >
            <ChevronRight />
          </button>}
        </div>
      </div>
    </Card>
  );
};

export { HourlyForecastPanel };
