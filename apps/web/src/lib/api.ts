import type { City, Coordinate } from "./model";
import { defaultCity } from "./utils";

export const getCity = async (coordinate: Coordinate): Promise<City | undefined> => {
  const response = await fetch(`/api/v1/reverse?lat=${coordinate.latitude}&lon=${coordinate.longitude}`);
  if (!response.ok) {
    return
  }

  let city: City = defaultCity();
  city.coordinate = coordinate;

  const json = await response.json();
  if (json && json.features.length > 0) {
    const c: any = json.features[0];

    city = {
      id: c.properties.osm_id,
      key: c.properties.osm_key,
      value: c.properties.osm_value,
      postcode: c.properties.postcode,
      housenumber: c.properties.housenumber,
      street: c.properties.street,
      type: c.properties.type,
      district: c.properties.district,
      city: c.properties.city,
      state: c.properties.state,
      country: c.properties.country,
      countrycode: c.properties.countrycode,
      elevation: 0,
      coordinate: coordinate,
      current: {
        temperature_2m: 0,
        interval: 0,
        time: '',
        weather_code: 99
      },
    };
  }

  return city;
}

export const getCities = async (keyword: string): Promise<Array<City>> => {
  const array: Array<City> = []
  const response = await fetch(`/api/v1/cities?keyword=${keyword}`);
  if (!response.ok) {
    return array;
  }

  const json = await response.json();
  if (json && json.features.length > 0) {
    json.features.forEach((c: any) => array.push({
      id: c.properties.osm_id,
      city: c.properties.name,
      state: c.properties.state,
      country: c.properties.country,
      elevation: 0,
      coordinate: {
        latitude: c.geometry.coordinates[1],
        longitude: c.geometry.coordinates[0],
      },
      current: {
        temperature_2m: 0,
        interval: 0,
        time: '',
        weather_code: 99
      },
    }));
  }

  return array;
}

// export const getMeteo = async (city: City): Promise<City> => {
//   const response = await fetch(`/api/v1/temperature?latidude=${city.coordinate.latitude}&longtitude=${city.coordinate.longitude}`);
//   if (!response.ok) {
//     return city;
//   }

//   const json = await response.json();
//   city.current = json.current;
//   city.elevation = json.elevation;
//   return city;
// }

// Add to web/src/lib/api.ts
export const getMeteo = async (city: City): Promise<City> => {
  const response = await fetch(`/api/v1/temperature?latidude=${city.coordinate.latitude}&longtitude=${city.coordinate.longitude}`);
  if (!response.ok) {
    return city;
  }

  const json = await response.json();
  city.current = json.current;
  city.elevation = json.elevation;

  // Handle daily forecast data from the API
  if (json.daily && json.daily.time && json.daily.temperature_2m_min &&
    json.daily.temperature_2m_max && json.daily.weather_code) {
    const daysCount = Math.min(json.daily.time.length, 10);
    city.daily_forecast = [];

    for (let i = 0; i < daysCount; i++) {
      city.daily_forecast.push({
        time: json.daily.time[i],
        temperature_2m_max: json.daily.temperature_2m_max[i],
        temperature_2m_min: json.daily.temperature_2m_min[i],
        sunrise: json.daily.sunrise[i],
        sunset: json.daily.sunset[i],
        weather_code: json.daily.weather_code[i],
        precipitation_sum: json.daily.precipitation_sum ? json.daily.precipitation_sum[i] : 0,
        wind_speed_10m_max: json.daily.wind_speed_10m_max ? json.daily.wind_speed_10m_max[i] : 0
      });
    }
  }

  // Handle hourly forecast data from the API
  if (json.hourly && json.hourly.time && json.hourly.temperature_2m &&
    json.hourly.precipitation_probability) {

    // Create array with all available hours
    const allHours = [];
    for (let i = 0; i < json.hourly.time.length; i++) {
      allHours.push({
        time: json.hourly.time[i],
        temperature_2m: json.hourly.temperature_2m[i],
        precipitation_probability: json.hourly.precipitation_probability[i],
        wind_speed_10m: json.hourly.wind_speed_10m ? json.hourly.wind_speed_10m[i] : 0,
        cloud_cover: json.hourly.cloud_cover ? json.hourly.cloud_cover[i] : 0
      });
    }

    // Get current time and filter from now onwards (next 24 hours)
    const now = new Date();
    // Subtract 1 hour to ensure current hour is included when showing forecast
    now.setHours(now.getHours() - 1);
    const filteredHours = allHours.filter(hour => {
      const hourTime = new Date(hour.time);
      return hourTime >= now;
    });

    // Limit to next 24 hours
    // city.hourly_forecast = filteredHours.slice(0, 24);
    city.hourly_forecast = filteredHours;
  }

  return city;
}