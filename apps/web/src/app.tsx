import { useEffect, useState } from "preact/hooks";
import { Header, HeaderSearch, HeaderTitle } from "./components/header";
import { Button } from "./components/ui/button";
import { getCity, getMeteo } from "./lib/api";
import { defaultCity, getGeolocation } from "./lib/utils";

import { EmbeddedMap } from "./components/embeddedmap";
import { ForecastPanel } from "./components/forecastpanel";
import { HourlyForecastPanel } from "./components/hourlyforecast";
import type { City } from "./lib/model";

export function App() {
  const [city, setCity] = useState<City>(defaultCity());
  const [currentDay, setCurrentDay] = useState(0);

  useEffect(() => {
    const loadCity = async () => {
      // Try to load city from session storage
      const savedCity = sessionStorage.getItem("city-session");
      if (savedCity) {
        onSearch(JSON.parse(savedCity));
        return;
      } else {
        const defaultCity = await getCity(city.coordinate);
        onSearch(defaultCity!);
      }

      try {
        // Attempt to get user's geolocation
        const coordinate = await getGeolocation();
        if (coordinate) {
          const c = await getCity(coordinate);
          onSearch(c!);
        }
      } catch (error) {
        // Handle any errors during geolocation or city lookup
        console.error('Failed to load city:', error);
      }
    };

    loadCity();
  }, []);

  const onSearch = async (city: City) => {
    if (city) {
      sessionStorage.setItem("city-session", JSON.stringify(city));
      city = await getMeteo(city);
      setCity(city);
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

          <HourlyForecastPanel city={city} currentDay={currentDay} />
          <div className="pt-6 flex flex-col md:flex-row">
            <ForecastPanel city={city} onCurrentDay={(d) => setCurrentDay(d)} />
            {city.coordinate && <EmbeddedMap
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

