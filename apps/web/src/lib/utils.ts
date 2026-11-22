import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { City, Coordinate } from "./model"
import { CoordinateValidator } from "./validator"

const CITY_CACHE_KEY = "city-session"
const CITY_CACHE_VERSION = 2
const CITY_CACHE_TTL_MS = 24 * 60 * 60 * 1000

type CachedCity = {
  version: number
  savedAt: number
  city: City
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function loadCachedCity(): City | undefined {
  try {
    const raw = sessionStorage.getItem(CITY_CACHE_KEY)
    if (!raw) return undefined

    const cached = JSON.parse(raw) as Partial<CachedCity>
    const city = cached.city

    const isValid =
      cached.version === CITY_CACHE_VERSION &&
      typeof cached.savedAt === "number" &&
      Date.now() - cached.savedAt < CITY_CACHE_TTL_MS &&
      city !== undefined &&
      typeof city.city === "string" &&
      city.city !== "Loading..." &&
      city.city !== "Unknown location" &&
      city.coordinate !== undefined &&
      CoordinateValidator.validateCoordinate(city.coordinate)

    if (!isValid) {
      sessionStorage.removeItem(CITY_CACHE_KEY)
      return undefined
    }

    return city
  } catch {
    sessionStorage.removeItem(CITY_CACHE_KEY)
    return undefined
  }
}

export function saveCachedCity(city: City): void {
  try {
    const cached: CachedCity = {
      version: CITY_CACHE_VERSION,
      savedAt: Date.now(),
      city,
    }
    sessionStorage.setItem(CITY_CACHE_KEY, JSON.stringify(cached))
  } catch {
    // Storage can be unavailable (private mode, quota); ignore.
  }
}

export function defaultCity(): City {
  return {
    id: 0,
    city: 'Loading...',
    state: '',
    country: '',
    elevation: 0,
    coordinate: {
      latitude: 52.52096861412798,
      longitude: 13.409411488636199,
    },
    current: {
      temperature_2m: 0,
      interval: 0,
      time: '',
      weather_code: 99,
    },
  }
}

export function getGeolocation(): Promise<Coordinate | undefined> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        function (error) {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              console.log("User denied the request for Geolocation.");
              break;
            case error.POSITION_UNAVAILABLE:
              console.log("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              console.log("The request to get user location timed out.");
              break;
            default:
              console.log("An unknown error occurred.");
              break;
          }
          resolve(undefined);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 300000
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      resolve(undefined);
    }
  });
}