import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { City, Coordinate } from "./model"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
      resolve(undefined);
    }
  });
}