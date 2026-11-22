import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { City, Coordinate } from "./model"
import { CoordinateValidator } from "./validator"

const CITY_CACHE_KEY = "city-cache"
const LEGACY_CITY_CACHE_KEY = "city-session"
const CITY_CACHE_VERSION = 3
const CITY_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

type CachedCity = {
  version: number
  savedAt: number
  city: City
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function parseCachedCity(raw: string): City | undefined {
  const parsed = JSON.parse(raw) as any
  if (!parsed || typeof parsed !== "object") return undefined

  let city: any
  if (typeof parsed.city === "string") {
    // Legacy format: the raw City object.
    city = parsed
  } else if (parsed.city && typeof parsed.city === "object") {
    if (parsed.version !== CITY_CACHE_VERSION) return undefined
    if (typeof parsed.savedAt !== "number") return undefined
    if (Date.now() - parsed.savedAt > CITY_CACHE_TTL_MS) return undefined
    city = parsed.city
  } else {
    return undefined
  }

  if (
    typeof city.city !== "string" ||
    city.city === "Loading..." ||
    city.city === "Unknown location" ||
    !city.coordinate ||
    !CoordinateValidator.validateCoordinate(city.coordinate)
  ) {
    return undefined
  }

  return city as City
}

export function loadCachedCity(): City | undefined {
  const sources: Array<[Storage, string]> = [
    [localStorage, CITY_CACHE_KEY],
    [sessionStorage, LEGACY_CITY_CACHE_KEY],
  ]

  for (const [storage, key] of sources) {
    try {
      const raw = storage.getItem(key)
      if (!raw) continue

      const city = parseCachedCity(raw)
      if (city) {
        // Refresh the timestamp and migrate legacy entries to persistent storage.
        saveCachedCity(city)
        return city
      }
      storage.removeItem(key)
    } catch {
      try {
        storage.removeItem(key)
      } catch {
        // Storage unavailable; ignore.
      }
    }
  }

  return undefined
}

export function saveCachedCity(city: City): void {
  const cached: CachedCity = {
    version: CITY_CACHE_VERSION,
    savedAt: Date.now(),
    city,
  }

  try {
    localStorage.setItem(CITY_CACHE_KEY, JSON.stringify(cached))
    sessionStorage.removeItem(LEGACY_CITY_CACHE_KEY)
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