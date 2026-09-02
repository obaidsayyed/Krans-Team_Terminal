export interface DetailedAddressInfo {
  buildingName: string;
  houseNumber: string;
  street: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  postcode: string;
  fullAddress: string;
  isDetailed: boolean; // true if it contains street, building, or area
}

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters (target <= 50m)
  address: string;
  buildingName?: string;
  street?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postcode?: string;
  source: 'gps-high-accuracy' | 'gps-standard' | 'manual-pin' | 'search' | 'coords-input' | 'coarse-estimate' | 'cached';
  isApproximate: boolean; // true if > 50m error margin or missing street level
}

export interface LocationSearchResult {
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  address?: {
    house_number?: string;
    building?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    amenity?: string;
    shop?: string;
    office?: string;
    [key: string]: string | undefined;
  };
}

export const STRICT_MAX_ACCURACY_METERS = 50;
const STORAGE_LAST_LOCATION = 'civicpulse_last_verified_geo';

/**
 * Persist verified accurate location to localStorage
 */
export function saveLastKnownLocation(loc: GeoLocationResult) {
  try {
    localStorage.setItem(STORAGE_LAST_LOCATION, JSON.stringify(loc));
  } catch (e) {
    // ignore
  }
}

/**
 * Retrieve cached location from localStorage if available
 */
export function getLastKnownLocation(): GeoLocationResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_LAST_LOCATION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.latitude && parsed.longitude) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

/**
 * Parse coordinates from string (handles "lat, lng", "lat lng", or Google Maps URLs)
 */
export function parseCoordinatesInput(input: string): { latitude: number; longitude: number } | null {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();

  // 1. Google Maps URL pattern (e.g. /@19.0760,72.8777 or ?q=19.0760,72.8777)
  const urlMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || str.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (urlMatch) {
    const lat = parseFloat(urlMatch[1]);
    const lng = parseFloat(urlMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  // 2. Direct Lat, Lng pattern: e.g. "28.6139, 77.2090" or "28.6139 77.2090"
  const coordsMatch = str.match(/(-?\d{1,3}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
  if (coordsMatch) {
    const lat = parseFloat(coordsMatch[1]);
    const lng = parseFloat(coordsMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  return null;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Checks if an address string is too vague (just city or coordinates without street/building)
 */
export function isVagueAddress(addr: string): boolean {
  if (!addr || addr.trim().length < 5) return true;
  const lower = addr.toLowerCase().trim();
  if (lower.startsWith('incident spot') || lower.startsWith('tap map') || lower.startsWith('coordinates:')) {
    return true;
  }
  const parts = addr.split(',').map(s => s.trim()).filter(Boolean);
  return parts.length <= 1;
}

/**
 * Ultra-detailed reverse geocoding extracting building name, house number, street/road, colony/area, and landmark.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<DetailedAddressInfo> {
  // Strategy 1: BigDataCloud Client + OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1&namedetails=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en'
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};
      const extratags = data.extratags || {};

      // 1. Building / Place / POI name
      const buildingName = 
        data.name ||
        addr.building || 
        addr.amenity || 
        addr.shop || 
        addr.office || 
        addr.house_name || 
        addr.commercial || 
        addr.flats || 
        addr.apartments || 
        extratags.brand || 
        '';

      // 2. House / Flat / Plot / Door number
      const houseNumber = 
        addr.house_number || 
        addr.unit || 
        addr.door_number || 
        addr.street_number || 
        '';

      // 3. Street / Road / Highway / Lane
      const street = 
        addr.road || 
        addr.pedestrian || 
        addr.street || 
        addr.footway || 
        addr.highway || 
        addr.lane || 
        addr.path || 
        addr.service || 
        addr.alley || 
        '';

      // 4. Area / Colony / Sector / Neighbourhood / Suburb
      const area = 
        addr.neighbourhood || 
        addr.suburb || 
        addr.residential || 
        addr.quarter || 
        addr.city_district || 
        addr.subdistrict || 
        addr.block || 
        addr.sector || 
        addr.housing_estate || 
        addr.village || 
        addr.hamlet || 
        '';

      // 5. City / Municipality
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || 'Local Area';
      const state = addr.state || addr.province || '';
      const postcode = addr.postcode || '';

      // Compose Building & House prefix
      let premisesPart = '';
      if (buildingName && houseNumber) {
        premisesPart = `${houseNumber}, ${buildingName}`;
      } else if (buildingName) {
        premisesPart = buildingName;
      } else if (houseNumber) {
        premisesPart = `No. ${houseNumber}`;
      }

      // If building name is identical to street, avoid repeating
      if (premisesPart.toLowerCase() === street.toLowerCase()) {
        premisesPart = '';
      }

      // Compose address hierarchy
      const segments: string[] = [];
      if (premisesPart) segments.push(premisesPart);
      if (street && street.toLowerCase() !== premisesPart.toLowerCase()) segments.push(street);
      if (area && area.toLowerCase() !== street.toLowerCase()) segments.push(area);
      if (city && city.toLowerCase() !== area.toLowerCase()) segments.push(city);
      if (state) {
        segments.push(postcode ? `${state} - ${postcode}` : state);
      } else if (postcode) {
        segments.push(postcode);
      }

      const fullAddress = segments.length > 0 
        ? segments.join(', ') 
        : (data.display_name || `Spot near ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`);

      // Landmark generation
      let landmark = '';
      if (buildingName) {
        landmark = `At/Near ${buildingName}`;
      } else if (street && area) {
        landmark = `Near ${street}, ${area}`;
      } else if (area) {
        landmark = `Area: ${area}`;
      } else if (street) {
        landmark = `Off ${street}`;
      } else {
        landmark = `Coordinates: ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`;
      }

      const isDetailed = Boolean(buildingName || houseNumber || street || area);

      return {
        buildingName,
        houseNumber,
        street,
        area,
        landmark,
        city,
        state,
        postcode,
        fullAddress,
        isDetailed
      };
    }
  } catch (err) {
    console.warn('OSM Nominatim reverse geocode notice:', err);
  }

  // Strategy 2: BigDataCloud Client Reverse Geocoder
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const bdcRes = await fetch(bdcUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const city = bdcData.city || bdcData.locality || 'Local City';
      const area = bdcData.locality || bdcData.principalSubdivisionCode || '';
      const state = bdcData.principalSubdivision || '';
      const postcode = bdcData.postcode || '';
      const country = bdcData.countryName || '';

      const segments = [area, city, state, postcode].filter(Boolean);
      const fullAddress = segments.join(', ') || `${city}, ${state} (${lat.toFixed(5)}°, ${lng.toFixed(5)}°)`;

      return {
        buildingName: '',
        houseNumber: '',
        street: '',
        area,
        landmark: area ? `In / Near ${area}` : `Near ${city}`,
        city,
        state,
        postcode,
        fullAddress,
        isDetailed: Boolean(area || city)
      };
    }
  } catch (err) {
    console.warn('BigDataCloud geocode notice:', err);
  }

  // Strategy 3: Photon Reverse Geocoder (Komoot OSM engine)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
    const photonRes = await fetch(photonUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (photonRes.ok) {
      const photonData = await photonRes.json();
      if (photonData.features && photonData.features.length > 0) {
        const props = photonData.features[0].properties || {};
        const buildingName = props.name || '';
        const houseNumber = props.housenumber || '';
        const street = props.street || '';
        const area = props.district || props.suburb || props.locality || '';
        const city = props.city || props.town || props.village || 'City';
        const state = props.state || '';
        const postcode = props.postcode || '';

        const premises = [houseNumber, buildingName].filter(Boolean).join(' ');
        const segments = [premises, street, area, city, postcode ? `${state} ${postcode}` : state].filter(Boolean);
        const fullAddress = segments.join(', ') || `Exact Spot (${lat.toFixed(5)}°, ${lng.toFixed(5)}°)`;

        const landmark = buildingName ? `Near ${buildingName}` : (street ? `On ${street}` : `Area ${area || city}`);

        return {
          buildingName,
          houseNumber,
          street,
          area,
          landmark,
          city,
          state,
          postcode,
          fullAddress,
          isDetailed: Boolean(buildingName || street || area)
        };
      }
    }
  } catch (err) {
    console.warn('Photon geocode notice:', err);
  }

  // Fallback: Exact GPS coordinate spot
  return {
    buildingName: '',
    houseNumber: '',
    street: '',
    area: '',
    landmark: `Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}`,
    city: 'Local Area',
    state: '',
    postcode: '',
    fullAddress: `Incident Location (${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E)`,
    isDetailed: false
  };
}

/**
 * Forward geocoding: searches place, colony, or landmark with high precision
 */
export async function geocodeAddress(query: string): Promise<GeoLocationResult | null> {
  if (!query || query.trim().length < 2) return null;

  // Check if query is actually a pasted coordinate or Google Maps link first!
  const parsedCoords = parseCoordinatesInput(query);
  if (parsedCoords) {
    const geo = await reverseGeocode(parsedCoords.latitude, parsedCoords.longitude);
    const result: GeoLocationResult = {
      latitude: parsedCoords.latitude,
      longitude: parsedCoords.longitude,
      accuracy: 5, // Exact numerical coordinates input = 5m precision
      address: geo.fullAddress,
      buildingName: geo.buildingName,
      street: geo.street,
      area: geo.area,
      landmark: geo.landmark,
      city: geo.city,
      state: geo.state,
      postcode: geo.postcode,
      source: 'coords-input',
      isApproximate: false
    };
    saveLastKnownLocation(result);
    return result;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query.trim())}&limit=1&addressdetails=1&extratags=1&namedetails=1`,
      {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'Accept-Language': 'en' }
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = Number(parseFloat(item.lat).toFixed(6));
        const lng = Number(parseFloat(item.lon).toFixed(6));
        const addr = item.address || {};
        
        const buildingName = item.name || addr.building || addr.amenity || addr.shop || '';
        const houseNumber = addr.house_number || '';
        const road = addr.road || addr.pedestrian || addr.street || '';
        const sub = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || '';
        const city = addr.city || addr.town || addr.village || 'City';
        const state = addr.state || '';
        const postcode = addr.postcode || '';

        const premises = [houseNumber, buildingName].filter(Boolean).join(', ');
        const formatted = [premises, road, sub, city, postcode ? `${state} ${postcode}` : state]
          .filter(Boolean)
          .join(', ') || item.display_name;

        const result: GeoLocationResult = {
          latitude: lat,
          longitude: lng,
          accuracy: 5, // Specific geocoded building/street pin
          address: formatted,
          buildingName,
          street: road,
          area: sub,
          landmark: sub ? `Area: ${sub}` : (road ? `Near ${road}` : `Searched: ${query}`),
          city,
          state,
          postcode,
          source: 'search',
          isApproximate: false
        };

        saveLastKnownLocation(result);
        return result;
      }
    }
  } catch (e) {
    console.warn('Geocoding search query failed:', e);
  }

  return null;
}

/**
 * Autocomplete search for places, colonies, metro stations, buildings
 */
export async function searchPlaces(query: string): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query.trim())}&limit=8&addressdetails=1&extratags=1`,
      {
        signal: controller.signal,
        headers: { 'Accept': 'application/json', 'Accept-Language': 'en' }
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return (data || []).map((item: any) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        address: item.address
      }));
    }
  } catch (e) {
    console.warn('Place search error:', e);
  }

  return [];
}

/**
 * High-accuracy Hardware GPS detector with strict <= 50m error margin enforcement
 */
export async function getExactUserLocation(
  onProgress?: (status: string, accuracy?: number) => void
): Promise<GeoLocationResult> {
  onProgress?.('Accessing hardware GPS satellite telemetry...');

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      onProgress?.('Browser geolocation unavailable. Please tap map to pin spot.');
      resolve(getFallbackLocation('No browser geolocation'));
      return;
    }

    let isResolved = false;
    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;

    const cleanup = () => {
      if (watchId !== null) {
        try {
          navigator.geolocation.clearWatch(watchId);
        } catch {
          // ignore
        }
        watchId = null;
      }
    };

    // Safety timeout after 6.5 seconds
    const safetyTimeout = setTimeout(async () => {
      if (isResolved) return;
      cleanup();

      if (bestPosition) {
        isResolved = true;
        const lat = Number(bestPosition.coords.latitude.toFixed(6));
        const lng = Number(bestPosition.coords.longitude.toFixed(6));
        const accuracy = Math.round(bestPosition.coords.accuracy || 100);
        const meetsStrict50m = accuracy <= STRICT_MAX_ACCURACY_METERS;

        onProgress?.(
          meetsStrict50m 
            ? `🎯 Verified GPS Fix (±${accuracy}m accuracy)` 
            : `⚠️ Broad reading (±${accuracy}m). Click map or type street/building to lock exact spot.`,
          accuracy
        );

        const geoInfo = await reverseGeocode(lat, lng);
        const result: GeoLocationResult = {
          latitude: lat,
          longitude: lng,
          accuracy,
          address: geoInfo.fullAddress,
          buildingName: geoInfo.buildingName,
          street: geoInfo.street,
          area: geoInfo.area,
          landmark: geoInfo.landmark,
          city: geoInfo.city,
          state: geoInfo.state,
          postcode: geoInfo.postcode,
          source: meetsStrict50m ? 'gps-high-accuracy' : 'coarse-estimate',
          isApproximate: !meetsStrict50m
        };

        if (meetsStrict50m) {
          saveLastKnownLocation(result);
        }
        resolve(result);
      } else {
        isResolved = true;
        onProgress?.('GPS satellite timeout. Please tap your exact spot on the map.');
        resolve(getFallbackLocation('GPS timeout'));
      }
    }, 6500);

    try {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          if (isResolved) return;

          const currentAcc = position.coords.accuracy;
          if (!bestPosition || currentAcc < bestPosition.coords.accuracy) {
            bestPosition = position;
            onProgress?.(`Calibrating GPS satellites: current margin ±${Math.round(currentAcc)}m...`, Math.round(currentAcc));
          }

          // If accuracy is high (under 50 meters, satisfies strict ±50m rule), lock immediately!
          if (currentAcc <= STRICT_MAX_ACCURACY_METERS) {
            isResolved = true;
            clearTimeout(safetyTimeout);
            cleanup();

            const lat = Number(position.coords.latitude.toFixed(6));
            const lng = Number(position.coords.longitude.toFixed(6));
            const accuracy = Math.round(position.coords.accuracy);

            onProgress?.(`🎯 Locked High-Precision GPS: ±${accuracy}m (≤50m strict accuracy verified)`, accuracy);
            const geoInfo = await reverseGeocode(lat, lng);

            const result: GeoLocationResult = {
              latitude: lat,
              longitude: lng,
              accuracy,
              address: geoInfo.fullAddress,
              buildingName: geoInfo.buildingName,
              street: geoInfo.street,
              area: geoInfo.area,
              landmark: geoInfo.landmark,
              city: geoInfo.city,
              state: geoInfo.state,
              postcode: geoInfo.postcode,
              source: 'gps-high-accuracy',
              isApproximate: false
            };

            saveLastKnownLocation(result);
            resolve(result);
          }
        },
        (err) => {
          console.warn('Geolocation watch error:', err.code, err.message);
          if (err.code === 1 && !isResolved) {
            isResolved = true;
            clearTimeout(safetyTimeout);
            cleanup();
            onProgress?.('Location permission restricted. Please tap map to pin spot.');
            resolve(getFallbackLocation('Permission denied'));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 0
        }
      );
    } catch (e) {
      console.warn('Failed to start geolocation watch:', e);
      if (!isResolved) {
        isResolved = true;
        clearTimeout(safetyTimeout);
        cleanup();
        resolve(getFallbackLocation('Error starting watch'));
      }
    }
  });
}

function getFallbackLocation(reason: string): GeoLocationResult {
  const cached = getLastKnownLocation();
  if (cached && !cached.isApproximate) {
    return { ...cached, source: 'cached' };
  }

  return {
    latitude: 28.6139,
    longitude: 77.2090,
    accuracy: 500,
    address: 'Near Central Secretariat, Rajpath Area, New Delhi - 110001',
    buildingName: 'Central Secretariat',
    street: 'Rajpath',
    area: 'Central Delhi',
    landmark: 'Opposite India Gate Corridor',
    city: 'New Delhi',
    state: 'Delhi',
    postcode: '110001',
    source: 'coarse-estimate',
    isApproximate: true
  };
}
