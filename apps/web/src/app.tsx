import { useEffect, useState } from "preact/hooks";
import { Header, HeaderSearch, HeaderTitle } from "./components/header";
import { Button } from "./components/ui/button";
import { getCity, getMeteo } from "./lib/api";
import { defaultCity, getGeolocation, loadCachedCity, saveCachedCity } from "./lib/utils";

import { EmbeddedMap, MapSkeleton } from "./components/embeddedmap";
import { ForecastPanel, ForecastPanelSkeleton } from "./components/forecastpanel";
import { HourlyForecastPanel, HourlyForecastSkeleton } from "./components/hourlyforecast";
import type { City } from "./lib/model";

export function App() {
  const [city, setCity] = useState<City>(defaultCity());
  const [currentDay, setCurrentDay] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadCity = async () => {
      // Only trust a validated, recent cache entry (e.g. an explicit city search).
      const cachedCity = loadCachedCity();
      if (cachedCity) {
        await onSearch(cachedCity, false);
        return;
      }

      setIsLoading(true);
      try {
        // Prefer the browser's location; fall back to the default city when
        // geolocation is denied or unavailable (common in incognito windows).
        const coordinate = await getGeolocation();
        if (cancelled) return;

        const city = await getCity(coordinate ?? defaultCity().coordinate);
        if (cancelled) return;

        await onSearch(city, false);
      } catch (error) {
        console.error('Failed to load city:', error);
        if (!cancelled) {
          const city = await getCity(defaultCity().coordinate);
          await onSearch(city, false);
        }
      }
    };

    loadCity();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSearch = async (city: City, cache = true) => {
    if (!city) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const withMeteo = await getMeteo(city);
      setCity(withMeteo);
      // Cache only explicit selections so a stale auto-detected location can
      // never override a fresh geolocation on the next visit.
      if (cache) {
        saveCachedCity(city);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleCoordinatesChange = async (lat: number, lng: number) => {
    // console.log('Coordinates updated:', lat, lng);
    const coordinate = {
      latitude: lat,
      longitude: lng
    }
    const c = await getCity(coordinate);
    onSearch(c!);
  };

  return (
    <>
      <section id="center" className="flex justify-center">
        <div className="max-w-6xl w-full">
          <Header className="flex flex-col sm:flex-row">
            <HeaderTitle className="">Weather</HeaderTitle>
            <HeaderSearch onSearch={(city) => onSearch(city as City)} />
            <Button variant="default" className="hidden sm:block" disabled>Sign In</Button>
          </Header>

          {isLoading ? <HourlyForecastSkeleton /> : <HourlyForecastPanel city={city} currentDay={currentDay} />}
          <div className="pt-6 flex flex-col md:flex-row">
            {isLoading ? <ForecastPanelSkeleton /> : <ForecastPanel city={city} onCurrentDay={(d) => setCurrentDay(d)} />}
            {isLoading ? <MapSkeleton /> : city.coordinate && <EmbeddedMap
              latitude={city.coordinate.latitude}
              longitude={city.coordinate.longitude}
              onCoordinatesChange={handleCoordinatesChange}
            />}
          </div>

        </div>
      </section>
    </>
  )
}

