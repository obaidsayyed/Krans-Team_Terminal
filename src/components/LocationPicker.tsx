import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Crosshair, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Target, 
  LocateFixed, 
  Copy, 
  Check, 
  MapPinCheck,
  Building2,
  Route,
  Radio
} from 'lucide-react';
import { 
  getExactUserLocation, 
  reverseGeocode, 
  searchPlaces, 
  parseCoordinatesInput, 
  saveLastKnownLocation, 
  STRICT_MAX_ACCURACY_METERS, 
  LocationSearchResult 
} from '../utils/geolocation';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  buildingName?: string;
  street?: string;
  area?: string;
  accuracy?: number;
  source?: 'gps-high-accuracy' | 'gps-standard' | 'manual-pin' | 'search' | 'coords-input' | 'coarse-estimate' | 'cached';
  isApproximate?: boolean;
  onChange: (data: {
    latitude: number;
    longitude: number;
    address: string;
    landmark: string;
    buildingName?: string;
    street?: string;
    area?: string;
    accuracy?: number;
    source?: 'gps-high-accuracy' | 'gps-standard' | 'manual-pin' | 'search' | 'coords-input' | 'coarse-estimate' | 'cached';
    isApproximate?: boolean;
  }) => void;
  accentColor?: 'indigo' | 'rose' | 'emerald' | 'blue';
  compact?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  address,
  landmark = '',
  buildingName = '',
  street = '',
  area = '',
  accuracy,
  source = 'manual-pin',
  isApproximate = false,
  onChange,
  accentColor = 'indigo',
  compact = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | undefined>(accuracy);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [showCoordsInput, setShowCoordsInput] = useState(false);
  const [manualCoordsText, setManualCoordsText] = useState('');
  const [copiedCoords, setCopiedCoords] = useState(false);

  const meetsStrict50m = (currentAccuracy !== undefined && currentAccuracy <= STRICT_MAX_ACCURACY_METERS) || 
    source === 'manual-pin' || 
    source === 'coords-input' || 
    source === 'search' ||
    source === 'gps-high-accuracy';

  // Theme styling
  const themeClasses = {
    indigo: {
      btn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      pinColor: '#4f46e5',
      glowRing: 'ring-indigo-500/30'
    },
    rose: {
      btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      pinColor: '#e11d48',
      glowRing: 'ring-rose-500/30'
    },
    emerald: {
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      pinColor: '#059669',
      glowRing: 'ring-emerald-500/30'
    },
    blue: {
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      pinColor: '#2563eb',
      glowRing: 'ring-blue-500/30'
    }
  }[accentColor];

  // Tactical custom animated pulse marker
  const createPulseMarkerIcon = useCallback((color: string) => {
    return L.divIcon({
      className: 'custom-leaflet-pulse-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; transform: translate(-50%, -100%); pointer-events: auto; cursor: grab;">
          <!-- Radar Ripple Outer -->
          <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 34px; height: 34px; background: ${color}; border-radius: 50%; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <!-- Precision Crosshair Center Pin -->
          <div style="position: absolute; bottom: 0; left: 50%; width: 32px; height: 32px; background: ${color}; border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: translateX(-50%) rotate(-45deg); box-shadow: 0 10px 25px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
            <div style="width: 9px; height: 9px; background: #ffffff; border-radius: 50%; transform: rotate(45deg); box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);"></div>
          </div>
          <!-- Pin Tip Ground Shadow -->
          <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 14px; height: 4px; background: rgba(0,0,0,0.5); border-radius: 50%; filter: blur(1.5px);"></div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      popupAnchor: [0, -44]
    });
  }, []);

  // Update location resolution helper
  const handleLocationUpdate = useCallback(async (
    lat: number, 
    lng: number, 
    acc: number, 
    src: 'gps-high-accuracy' | 'manual-pin' | 'search' | 'coords-input' | 'coarse-estimate'
  ) => {
    try {
      setStatusMessage(`Resolving address for (${lat.toFixed(5)}°, ${lng.toFixed(5)}°)...`);
      const geo = await reverseGeocode(lat, lng);
      const isStrict = acc <= STRICT_MAX_ACCURACY_METERS || src === 'manual-pin' || src === 'coords-input' || src === 'search';

      setCurrentAccuracy(acc);

      onChange({
        latitude: lat,
        longitude: lng,
        address: geo.fullAddress,
        landmark: geo.landmark,
        buildingName: geo.buildingName,
        street: geo.street,
        area: geo.area || geo.city,
        accuracy: acc,
        source: src,
        isApproximate: !isStrict
      });

      if (isStrict) {
        saveLastKnownLocation({
          latitude: lat,
          longitude: lng,
          address: geo.fullAddress,
          buildingName: geo.buildingName,
          street: geo.street,
          area: geo.area || geo.city,
          landmark: geo.landmark,
          city: geo.city,
          state: geo.state,
          postcode: geo.postcode,
          accuracy: acc,
          source: src,
          isApproximate: false
        });
        setStatusMessage(`🎯 Pinpoint Locked: ${geo.buildingName || geo.street || geo.fullAddress.split(',')[0]} (±${acc}m)`);
      } else {
        setStatusMessage(`📍 Location updated. Accuracy: ±${acc}m`);
      }

      setTimeout(() => setStatusMessage(null), 3500);
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
  }, [onChange]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 17,
        zoomControl: false,
        attributionControl: false
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      const streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      tileLayerRef.current = streetsLayer;

      const icon = createPulseMarkerIcon(themeClasses.pinColor);
      const marker = L.marker([latitude, longitude], {
        draggable: true,
        icon
      }).addTo(map);

      const initialAcc = accuracy || 15;
      const circle = L.circle([latitude, longitude], {
        radius: Math.min(initialAcc, 200),
        color: initialAcc <= STRICT_MAX_ACCURACY_METERS ? '#059669' : '#e11d48',
        fillColor: initialAcc <= STRICT_MAX_ACCURACY_METERS ? '#059669' : '#e11d48',
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(map);

      markerRef.current = marker;
      circleRef.current = circle;
      mapInstanceRef.current = map;

      // Handle marker drag
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        const newLat = Number(position.lat.toFixed(6));
        const newLng = Number(position.lng.toFixed(6));

        circle.setLatLng([newLat, newLng]);
        circle.setRadius(5);
        circle.setStyle({ color: '#059669', fillColor: '#059669' });
        setCurrentAccuracy(5);

        handleLocationUpdate(newLat, newLng, 5, 'manual-pin');
      });

      // Handle direct map click
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const newLat = Number(e.latlng.lat.toFixed(6));
        const newLng = Number(e.latlng.lng.toFixed(6));

        marker.setLatLng([newLat, newLng]);
        circle.setLatLng([newLat, newLng]);
        circle.setRadius(5);
        circle.setStyle({ color: '#059669', fillColor: '#059669' });
        setCurrentAccuracy(5);

        handleLocationUpdate(newLat, newLng, 5, 'manual-pin');
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [createPulseMarkerIcon, handleLocationUpdate, latitude, longitude, themeClasses.pinColor]);

  // Sync external coords updates
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (
        Math.abs(currentPos.lat - latitude) > 0.00001 ||
        Math.abs(currentPos.lng - longitude) > 0.00001
      ) {
        markerRef.current.setLatLng([latitude, longitude]);
        if (circleRef.current) {
          circleRef.current.setLatLng([latitude, longitude]);
          const effectiveAcc = accuracy || 5;
          circleRef.current.setRadius(Math.min(effectiveAcc, 200));
          circleRef.current.setStyle({
            color: effectiveAcc <= STRICT_MAX_ACCURACY_METERS ? '#059669' : '#e11d48',
            fillColor: effectiveAcc <= STRICT_MAX_ACCURACY_METERS ? '#059669' : '#e11d48'
          });
        }
        mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
      }
    }
  }, [latitude, longitude, accuracy]);

  // Trigger high-accuracy hardware GPS detection
  const handleDetectGPS = async () => {
    setIsLocating(true);
    setStatusMessage('Acquiring high-accuracy GNSS hardware satellite fix...');

    try {
      const loc = await getExactUserLocation((msg, acc) => {
        setStatusMessage(msg);
        if (acc) setCurrentAccuracy(acc);
      });

      if (loc && loc.latitude && loc.longitude) {
        setCurrentAccuracy(loc.accuracy);

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([loc.latitude, loc.longitude]);
          if (circleRef.current) {
            circleRef.current.setLatLng([loc.latitude, loc.longitude]);
            circleRef.current.setRadius(Math.min(loc.accuracy, 200));
            circleRef.current.setStyle({
              color: loc.accuracy <= STRICT_MAX_ACCURACY_METERS ? '#059669' : '#e11d48',
              fillColor: loc.accuracy <= STRICT_MAX_ACCURACY_METERS ? '#059669' : '#e11d48'
            });
          }
          mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 18, { animate: true, duration: 1.2 });
        }

        onChange({
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address,
          landmark: loc.landmark || '',
          buildingName: loc.buildingName,
          street: loc.street,
          area: loc.area,
          accuracy: loc.accuracy,
          source: loc.source,
          isApproximate: loc.isApproximate
        });
      }
    } catch (e) {
      console.warn('GPS detection error:', e);
      setStatusMessage('Unable to lock GPS. Tap your exact building or street on the map.');
    } finally {
      setIsLocating(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Search places autocomplete
  const handleSearchQueryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      setIsSearching(true);
      setShowSearchResults(true);
      const results = await searchPlaces(val);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Select Search Item
  const handleSelectSearchResult = (result: LocationSearchResult) => {
    const newLat = Number(result.lat.toFixed(6));
    const newLng = Number(result.lon.toFixed(6));

    const addr = result.address || {};
    const bName = result.display_name.split(',')[0] || addr.building || addr.amenity || '';
    const road = addr.road || addr.pedestrian || addr.street || '';
    const sub = addr.suburb || addr.neighbourhood || addr.city_district || '';
    const city = addr.city || addr.town || addr.village || '';
    const state = addr.state || '';
    const postcode = addr.postcode || '';

    const cleanAddress = [bName, road, sub, city, postcode ? `${state} ${postcode}` : state]
      .filter((v, idx, arr) => v && arr.indexOf(v) === idx)
      .join(', ') || result.display_name;
      
    const cleanLandmark = bName ? `At/Near ${bName}` : (sub ? `Area: ${sub}` : `Near ${road}`);

    onChange({
      latitude: newLat,
      longitude: newLng,
      address: cleanAddress,
      buildingName: bName,
      street: road,
      area: sub || city,
      landmark: cleanLandmark,
      accuracy: 5,
      source: 'search',
      isApproximate: false
    });

    saveLastKnownLocation({
      latitude: newLat,
      longitude: newLng,
      address: cleanAddress,
      buildingName: bName,
      street: road,
      area: sub || city,
      landmark: cleanLandmark,
      city,
      state,
      postcode,
      accuracy: 5,
      source: 'search',
      isApproximate: false
    });

    setCurrentAccuracy(5);
    setSearchQuery('');
    setShowSearchResults(false);

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
      if (circleRef.current) {
        circleRef.current.setLatLng([newLat, newLng]);
        circleRef.current.setRadius(5);
        circleRef.current.setStyle({ color: '#059669', fillColor: '#059669' });
      }
      mapInstanceRef.current.setView([newLat, newLng], 18, { animate: true });
    }

    setStatusMessage(`📍 Pinned to: ${bName || cleanAddress.split(',')[0]} (±5m precision)`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Submit manual coords or Google Maps link
  const handleManualCoordsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCoordsText.trim()) return;

    const parsed = parseCoordinatesInput(manualCoordsText);
    if (parsed) {
      setShowCoordsInput(false);
      setManualCoordsText('');
      handleLocationUpdate(parsed.latitude, parsed.longitude, 5, 'coords-input');

      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([parsed.latitude, parsed.longitude]);
        if (circleRef.current) {
          circleRef.current.setLatLng([parsed.latitude, parsed.longitude]);
          circleRef.current.setRadius(5);
          circleRef.current.setStyle({ color: '#059669', fillColor: '#059669' });
        }
        mapInstanceRef.current.setView([parsed.latitude, parsed.longitude], 18, { animate: true });
      }
    } else {
      setStatusMessage('Invalid format. Enter lat, lng (e.g. 19.0760, 72.8777) or Maps URL.');
    }
  };

  // Map layer toggle
  const toggleMapLayer = () => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    if (mapType === 'streets') {
      const satLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' }
      ).addTo(mapInstanceRef.current);
      tileLayerRef.current = satLayer;
      setMapType('satellite');
    } else {
      const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = streetLayer;
      setMapType('streets');
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([latitude, longitude], 18, { animate: true });
    }
  };

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="space-y-3">
      
      {/* 1. Header with Precision Status & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-xl shrink-0 ${meetsStrict50m ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 block">
                Incident Location Pinpoint
              </span>
              
              {meetsStrict50m ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  High Accuracy (±{currentAccuracy || 5}m)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Accuracy: ±{currentAccuracy}m
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              Drag pin or click map anywhere to pinpoint exact building / street
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setShowCoordsInput(!showCoordsInput)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            {showCoordsInput ? 'Close Coords' : 'Paste GPS / URL'}
          </button>

          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isLocating}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer ${themeClasses.btn}`}
            id="btn-detect-exact-gps"
          >
            <Radio className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : 'animate-pulse'}`} />
            <span>{isLocating ? 'Locking GNSS...' : 'Detect Exact GPS'}</span>
          </button>
        </div>
      </div>

      {/* Manual Coordinates Form */}
      {showCoordsInput && (
        <form onSubmit={handleManualCoordsSubmit} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPinCheck className="w-4 h-4 text-indigo-600" />
              Paste Exact Coordinates or Google Maps Link
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Mathematical Precision
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCoordsText}
              onChange={(e) => setManualCoordsText(e.target.value)}
              placeholder="e.g. 19.076090, 72.877426 or https://maps.google.com/?q=..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Apply Spot
            </button>
          </div>
        </form>
      )}

      {/* Notification Banner */}
      {statusMessage && (
        <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs flex items-center space-x-2.5 animate-fadeIn shadow-md">
          <Crosshair className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-spin" />
          <span className="font-mono text-[11px] truncate">{statusMessage}</span>
        </div>
      )}

      {/* 2. Instant Search Autocomplete */}
      <div className="relative z-20">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchQueryChange}
            onFocus={() => {
              if (searchResults.length > 0) setShowSearchResults(true);
            }}
            placeholder="Search landmark, colony, building, shop, metro station, hospital..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-9.5 pr-8 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-xs"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Dropdown Results */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto z-30">
            <div className="p-1.5 space-y-1">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl transition flex items-start space-x-2.5 cursor-pointer text-xs"
                >
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">
                      {item.display_name.split(',')[0]}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.display_name}
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                    Pin Here
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Interactive Leaflet Map */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-300 shadow-inner bg-slate-100">
        <div 
          ref={mapContainerRef} 
          className={`w-full ${compact ? 'h-52' : 'h-64 sm:h-72'} z-10`}
          style={{ minHeight: compact ? '208px' : '256px' }}
        />

        {/* Floating Controls */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center space-x-1.5">
          <button
            type="button"
            onClick={toggleMapLayer}
            className="px-2.5 py-1.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 text-[11px] font-bold rounded-lg shadow-md border border-slate-200 flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span className="capitalize">{mapType === 'streets' ? 'Satellite View' : 'Street Map'}</span>
          </button>

          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 rounded-lg shadow-md border border-slate-200 transition cursor-pointer"
            title="Recenter to Marker"
          >
            <LocateFixed className="w-3.5 h-3.5 text-indigo-600" />
          </button>
        </div>

        {/* Coordinates Badge */}
        <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5">
          <div className="bg-slate-950/90 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1.5 rounded-lg border border-white/20 shadow-lg flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${meetsStrict50m ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
            <span>{latitude.toFixed(6)}° N, {longitude.toFixed(6)}° E</span>
            <span className={`font-bold ${meetsStrict50m ? 'text-emerald-300' : 'text-amber-300'}`}>
              (±{currentAccuracy || 5}m)
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyCoords}
            className="p-1.5 bg-slate-950/90 backdrop-blur-md text-slate-200 hover:text-white rounded-lg border border-white/20 shadow-lg transition cursor-pointer"
            title="Copy coordinates"
          >
            {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        <div className="absolute bottom-2.5 right-2.5 z-20 pointer-events-none hidden sm:block">
          <span className="bg-white/95 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-indigo-600" />
            Click anywhere on map to pin exact spot
          </span>
        </div>
      </div>

      {/* 4. Resolved Building & Street Badges */}
      {(buildingName || street || area) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {buildingName && (
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-start space-x-2">
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Building / POI</span>
                <span className="font-bold text-slate-800 text-[11px] truncate block">{buildingName}</span>
              </div>
            </div>
          )}

          {street && (
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-start space-x-2">
              <Route className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Street / Road</span>
                <span className="font-bold text-slate-800 text-[11px] truncate block">{street}</span>
              </div>
            </div>
          )}

          {area && (
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-start space-x-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Colony / Area</span>
                <span className="font-bold text-slate-800 text-[11px] truncate block">{area}</span>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default LocationPicker;
