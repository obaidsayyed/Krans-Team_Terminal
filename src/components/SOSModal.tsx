import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  X, 
  MapPin, 
  HeartPulse, 
  Flame, 
  ShieldAlert, 
  Car, 
  Navigation, 
  CheckCircle2, 
  Volume2,
  Phone,
  User,
  Radio,
  Search
} from 'lucide-react';
import { ServiceDepartment, SOSAlert } from '../types';
import { triggerSOS } from '../utils/storage';
import { DEPARTMENTS } from '../utils/constants';
import { LocationPicker } from './LocationPicker';
import { getExactUserLocation, getLastKnownLocation, geocodeAddress } from '../utils/geolocation';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  citizenName?: string;
  citizenPhone?: string;
  onSOSCreated?: (sos: SOSAlert) => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  isAdmin = false,
  citizenName = 'Citizen In Distress',
  citizenPhone = '9876500000',
  onSOSCreated
}) => {
  const [sosType, setSosType] = useState<'medical' | 'fire' | 'crime' | 'accident' | 'general'>('medical');
  const [targetDept, setTargetDept] = useState<ServiceDepartment>('hospital');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [lat, setLat] = useState<number>(28.6329);
  const [lng, setLng] = useState<number>(77.2195);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [name, setName] = useState(citizenName);
  const [phone, setPhone] = useState(citizenPhone.replace(/\D/g, '').slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<SOSAlert | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const tenDigitPhoneRegex = /^\d{10}$/;

  useEffect(() => {
    if (isOpen) {
      setSuccessAlert(null);
      setFormError(null);
      setName(citizenName);
      setPhone(citizenPhone.replace(/\D/g, '').slice(0, 10));

      // Instant cached location
      const cached = getLastKnownLocation();
      if (cached) {
        setLat(cached.latitude);
        setLng(cached.longitude);
        setAccuracy(cached.accuracy);
        if (cached.address) setAddress(cached.address);
        if (cached.landmark) setLandmark(cached.landmark);
        if (cached.buildingName) setBuildingName(cached.buildingName);
        if (cached.street) setStreet(cached.street);
        if (cached.area) setArea(cached.area);
      }

      // Auto-detect exact GPS location on open
      setIsLocating(true);
      getExactUserLocation()
        .then((loc) => {
          setLat(loc.latitude);
          setLng(loc.longitude);
          setAccuracy(loc.accuracy);
          if (loc.address) setAddress(loc.address);
          if (loc.landmark) setLandmark(loc.landmark);
          if (loc.buildingName) setBuildingName(loc.buildingName);
          if (loc.street) setStreet(loc.street);
          if (loc.area) setArea(loc.area);
        })
        .catch((err) => {
          console.warn('SOS location acquisition warning:', err);
        })
        .finally(() => {
          setIsLocating(false);
        });
    }
  }, [isOpen, citizenName, citizenPhone]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleTypeChange = (type: 'medical' | 'fire' | 'crime' | 'accident' | 'general') => {
    setSosType(type);
    if (type === 'medical') setTargetDept('hospital');
    else if (type === 'fire') setTargetDept('fire');
    else if (type === 'crime') setTargetDept('police');
    else if (type === 'accident') setTargetDept('rto');
    else setTargetDept('police');
  };

  const handleCaptureLiveGPS = async () => {
    setIsLocating(true);
    try {
      const loc = await getExactUserLocation();
      setLat(loc.latitude);
      setLng(loc.longitude);
      setAccuracy(loc.accuracy);
      if (loc.address) setAddress(loc.address);
      if (loc.landmark) setLandmark(loc.landmark);
    } catch (e) {
      console.warn('Error capturing GPS:', e);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSendSOS = () => {
    setFormError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      setFormError('Please enter caller name between 2 and 60 characters.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone || !tenDigitPhoneRegex.test(trimmedPhone)) {
      setFormError('Please enter a valid 10-digit phone number (numbers only).');
      return;
    }

    const trimmedAddress = address.trim() || `Coordinates: ${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
    if (trimmedAddress.length < 5 || trimmedAddress.length > 200) {
      setFormError('Incident location address must be between 5 and 200 characters.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const alert = triggerSOS(
        sosType,
        trimmedName,
        trimmedPhone,
        {
          latitude: lat,
          longitude: lng,
          address: trimmedAddress,
          landmark: landmark.trim() || undefined,
          accuracy: accuracy || 10
        },
        targetDept
      );

      setSuccessAlert(alert);
      setIsSubmitting(false);
      if (onSOSCreated) onSOSCreated(alert);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-rose-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col text-slate-900">
        
        {/* Urgent Header */}
        <div className="bg-rose-600 px-5 sm:px-7 py-4 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-2xl animate-pulse">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black font-['Outfit'] tracking-tight flex items-center gap-2">
                <span>EMERGENCY SOS DISPATCH</span>
                <span className="text-[10px] bg-white text-rose-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  Live Siren
                </span>
              </h2>
              <p className="text-xs text-rose-100">
                Instantly rings alarm sirens across Central Admin & Response Station
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-rose-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2.5 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {successAlert ? (
            /* Broadcast Success */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 border border-rose-200 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Volume2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 font-['Outfit']">
                SOS ALERT BROADCASTED!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Alarm siren is actively ringing at <strong>Central Command HQ</strong> and the <strong>{DEPARTMENTS[successAlert.targetDept]?.name}</strong> response desk.
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Alert ID:</span>
                  <span className="font-bold text-rose-600">{successAlert.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Department:</span>
                  <span className="font-bold text-slate-800 uppercase">{successAlert.targetDept}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Caller:</span>
                  <span className="text-slate-800">{successAlert.callerName} ({successAlert.callerPhone})</span>
                </div>
                <div className="flex flex-col text-slate-600 pt-1 border-t border-slate-200">
                  <span className="text-slate-400 text-[10px]">Exact Coordinates:</span>
                  <span className="text-slate-800 font-bold text-[11px] truncate">
                    {successAlert.location.address} ({successAlert.location.latitude.toFixed(5)}° N, {successAlert.location.longitude.toFixed(5)}° E)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition cursor-pointer"
                >
                  Close & Monitor Response
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Emergency Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  
                  <button
                    type="button"
                    onClick={() => handleTypeChange('medical')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      sosType === 'medical'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <HeartPulse className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold">Medical (108)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('fire')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      sosType === 'fire'
                        ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Flame className="w-5 h-5 text-rose-600" />
                    <span className="text-xs font-bold">Fire (101)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('crime')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      sosType === 'crime'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldAlert className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-bold">Police (100)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange('accident')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      sosType === 'accident'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Car className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-bold">RTO / Traffic</span>
                  </button>

                </div>
              </div>

              {/* Caller details with strict 10 digits validation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Caller Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                      placeholder="Caller name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    10-Digit Mobile <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                      placeholder="10-digit number"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">{phone.length}/10 digits</span>
                </div>
              </div>

              {/* Location & GPS with Interactive Map */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    2. Exact Incident Pinpoint & Address <span className="text-rose-500">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCaptureLiveGPS}
                    className="px-2.5 py-1 text-xs bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-semibold flex items-center space-x-1 cursor-pointer transition"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Calibrating...' : 'Refresh GPS'}</span>
                  </button>
                </div>

                <LocationPicker
                  latitude={lat}
                  longitude={lng}
                  address={address}
                  landmark={landmark}
                  buildingName={buildingName}
                  street={street}
                  area={area}
                  accuracy={accuracy}
                  accentColor="rose"
                  compact={true}
                  onChange={(data) => {
                    setLat(data.latitude);
                    setLng(data.longitude);
                    setAddress(data.address);
                    setLandmark(data.landmark);
                    if (data.buildingName !== undefined) setBuildingName(data.buildingName);
                    if (data.street !== undefined) setStreet(data.street);
                    if (data.area !== undefined) setArea(data.area);
                    if (data.accuracy) setAccuracy(data.accuracy);
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Street / Area Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                      placeholder="Enter exact street / building / area"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nearest Landmark
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                      placeholder="e.g. Opposite Metro Station"
                    />
                  </div>
                </div>
              </div>

              {/* Broadcast Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendSOS}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                  <span>BROADCAST 1-TAP EMERGENCY SOS NOW</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
