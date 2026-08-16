export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type DailyForecast = {
  time: string;
  temperature_2m_max: number;
  temperature_2m_min: number;
  sunrise: string;
  sunset: string;
  weather_code: number;
  precipitation_sum: number;
  wind_speed_10m_max: number;
};

export type HourlyForecast = {
  time: string;
  temperature_2m: number;
  precipitation_probability: number;
  wind_speed_10m: number;
  cloud_cover: number;
};

export type City = {
  id: number
  key?: string
  type?: string
  value?: string
  postcode?: string
  housenumber?: number
  city: string
  street?: string
  district?: string
  state: string
  country: string
  countrycode?: string
  coordinate: Coordinate
  current: {
    temperature_2m: number
    interval: number
    time: string
    weather_code: number
  }
  elevation: number
  daily_forecast?: DailyForecast[]
  hourly_forecast?: HourlyForecast[]
};

export const weatherIcons = {
  0: '☀️',    // Clear sky
  1: '🌤️',    // Mainly clear
  2: '⛅',    // Partly cloudy
  3: '☁️',    // Overcast
  45: '🌫️',   // Fog
  48: '🌫️',   // Depositing rime fog
  51: '🌦️',   // Light drizzle
  53: '🌦️',   // Moderate drizzle
  55: '🌧️',   // Dense drizzle
  61: '🌧️',   // Slight rain
  63: '🌧️',   // Moderate rain
  65: '🌧️',   // Heavy rain
  66: '⛈️',   // Light freezing rain (Grouped with thunderstorms due to associated cold/severity)
  67: '⛈️',   // Heavy freezing rain (Same group as 66)
  71: '❄️',   // Slight snow fall
  73: '❄️',   // Moderate snow fall
  75: '❄️',   // Heavy snow fall
  77: '❄️',   // Snow grains
  80: '🌦️',   // Light rain showers
  81: '🌧️',   // Moderate rain showers
  82: '⛈️',   // Heavy rain showers (Uses thunderstorm icon to imply powerful downpour)
  85: '❄️',   // Slight snow showers
  86: '❄️',   // Heavy snow showers
  95: '⛈️',   // Thunderstorm
  96: '⛈️',   // Thunderstorm with slight hail
  99: '⛈️'    // Thunderstorm with heavy hail
};

