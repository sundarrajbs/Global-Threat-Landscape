export interface CountryGeo {
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
}

// Approximate centroids for a broad set of countries — good enough for
// visualization purposes (not for precise geolocation).
export const COUNTRIES: CountryGeo[] = [
  { country: "United States", countryCode: "US", lat: 39.8, lon: -98.6 },
  { country: "China", countryCode: "CN", lat: 35.9, lon: 104.2 },
  { country: "Russia", countryCode: "RU", lat: 61.5, lon: 105.3 },
  { country: "Germany", countryCode: "DE", lat: 51.2, lon: 10.5 },
  { country: "United Kingdom", countryCode: "GB", lat: 55.4, lon: -3.4 },
  { country: "Brazil", countryCode: "BR", lat: -14.2, lon: -51.9 },
  { country: "India", countryCode: "IN", lat: 20.6, lon: 79.0 },
  { country: "Netherlands", countryCode: "NL", lat: 52.1, lon: 5.3 },
  { country: "France", countryCode: "FR", lat: 46.6, lon: 2.2 },
  { country: "Ukraine", countryCode: "UA", lat: 48.4, lon: 31.2 },
  { country: "Vietnam", countryCode: "VN", lat: 14.1, lon: 108.3 },
  { country: "Iran", countryCode: "IR", lat: 32.4, lon: 53.7 },
  { country: "North Korea", countryCode: "KP", lat: 40.3, lon: 127.5 },
  { country: "South Korea", countryCode: "KR", lat: 35.9, lon: 127.8 },
  { country: "Japan", countryCode: "JP", lat: 36.2, lon: 138.3 },
  { country: "Indonesia", countryCode: "ID", lat: -0.8, lon: 113.9 },
  { country: "Nigeria", countryCode: "NG", lat: 9.1, lon: 8.7 },
  { country: "South Africa", countryCode: "ZA", lat: -30.6, lon: 22.9 },
  { country: "Turkey", countryCode: "TR", lat: 38.9, lon: 35.2 },
  { country: "Poland", countryCode: "PL", lat: 51.9, lon: 19.1 },
  { country: "Romania", countryCode: "RO", lat: 45.9, lon: 24.9 },
  { country: "Mexico", countryCode: "MX", lat: 23.6, lon: -102.5 },
  { country: "Canada", countryCode: "CA", lat: 56.1, lon: -106.3 },
  { country: "Australia", countryCode: "AU", lat: -25.2, lon: 133.7 },
  { country: "Italy", countryCode: "IT", lat: 41.8, lon: 12.5 },
  { country: "Spain", countryCode: "ES", lat: 40.4, lon: -3.7 },
  { country: "Sweden", countryCode: "SE", lat: 60.1, lon: 18.6 },
  { country: "Switzerland", countryCode: "CH", lat: 46.8, lon: 8.2 },
  { country: "Singapore", countryCode: "SG", lat: 1.35, lon: 103.8 },
  { country: "Hong Kong", countryCode: "HK", lat: 22.3, lon: 114.1 },
  { country: "Pakistan", countryCode: "PK", lat: 30.3, lon: 69.3 },
  { country: "Bangladesh", countryCode: "BD", lat: 23.6, lon: 90.3 },
  { country: "Argentina", countryCode: "AR", lat: -38.4, lon: -63.6 },
  { country: "Egypt", countryCode: "EG", lat: 26.8, lon: 30.8 },
  { country: "Israel", countryCode: "IL", lat: 31.0, lon: 34.8 },
  { country: "Saudi Arabia", countryCode: "SA", lat: 23.8, lon: 45.0 },
  { country: "United Arab Emirates", countryCode: "AE", lat: 23.4, lon: 53.8 },
  { country: "Thailand", countryCode: "TH", lat: 15.9, lon: 100.9 },
  { country: "Philippines", countryCode: "PH", lat: 12.9, lon: 121.8 },
  { country: "Malaysia", countryCode: "MY", lat: 4.2, lon: 101.9 },
  { country: "Belarus", countryCode: "BY", lat: 53.7, lon: 27.9 },
  { country: "Czechia", countryCode: "CZ", lat: 49.8, lon: 15.5 },
  { country: "Bulgaria", countryCode: "BG", lat: 42.7, lon: 25.5 },
  { country: "Moldova", countryCode: "MD", lat: 47.4, lon: 28.4 },
  { country: "Colombia", countryCode: "CO", lat: 4.6, lon: -74.3 },
  { country: "Chile", countryCode: "CL", lat: -35.7, lon: -71.5 },
  { country: "Kenya", countryCode: "KE", lat: -0.02, lon: 37.9 },
  { country: "Morocco", countryCode: "MA", lat: 31.8, lon: -7.1 },
  { country: "Portugal", countryCode: "PT", lat: 39.4, lon: -8.2 },
  { country: "Ireland", countryCode: "IE", lat: 53.4, lon: -8.2 },
  { country: "Finland", countryCode: "FI", lat: 61.9, lon: 25.7 },
  { country: "Norway", countryCode: "NO", lat: 60.5, lon: 8.5 },
  { country: "Austria", countryCode: "AT", lat: 47.5, lon: 14.6 },
  { country: "Greece", countryCode: "GR", lat: 39.1, lon: 21.8 },
  { country: "Lithuania", countryCode: "LT", lat: 55.2, lon: 23.9 },
  { country: "Latvia", countryCode: "LV", lat: 56.9, lon: 24.6 },
  { country: "Estonia", countryCode: "EE", lat: 58.6, lon: 25.0 },
  { country: "Kazakhstan", countryCode: "KZ", lat: 48.0, lon: 66.9 },
  { country: "Taiwan", countryCode: "TW", lat: 23.7, lon: 121.0 },
  { country: "New Zealand", countryCode: "NZ", lat: -40.9, lon: 174.9 },
];

const BY_CODE = new Map(COUNTRIES.map((c) => [c.countryCode, c]));

export function getCountry(code?: string): CountryGeo {
  if (code) {
    const found = BY_CODE.get(code.toUpperCase());
    if (found) return found;
  }
  return randomCountry();
}

export function randomCountry(): CountryGeo {
  return COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
}

export function jitter(value: number, amount = 3): number {
  return value + (Math.random() - 0.5) * amount * 2;
}
