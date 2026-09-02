import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  MapPin, 
  Clock, 
  Upload, 
  ShieldAlert, 
  Car, 
  HeartPulse, 
  Flame, 
  Building2, 
  CheckCircle2, 
  Navigation,
  Volume2,
  User,
  Phone,
  Mail,
  AlertTriangle,
  Search
} from 'lucide-react';
import { Complaint, ComplaintSeverity, ServiceDepartment } from '../types';
import { DEPARTMENTS, SAMPLE_INCIDENT_PHOTOS } from '../utils/constants';
import { registerNewComplaint } from '../utils/storage';
import { playEmergencySiren } from '../utils/audio';
import { LocationPicker } from './LocationPicker';
import { getExactUserLocation, getLastKnownLocation, geocodeAddress } from '../utils/geolocation';
import { submitComplaint, triggerAIAnalysis, routeComplaint } from '../services/api';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  citizenName?: string;
  citizenEmail?: string;
  citizenPhone?: string;
  onComplaintCreated?: (complaint: Complaint) => void;
}

export const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  citizenName = '',
  citizenEmail = '',
  citizenPhone = '',
  onComplaintCreated
}) => {
  // Form State
  const [name, setName] = useState(citizenName);
  const [email, setEmail] = useState(citizenEmail);
  const [phone, setPhone] = useState(citizenPhone);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [preferredService, setPreferredService] = useState<ServiceDepartment>('municipal');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState<ComplaintSeverity>('medium');
  const [isEmergencyPriority, setIsEmergencyPriority] = useState(false);

  // Evidence Photo
  const [photoUrl, setPhotoUrl] = useState<string>(SAMPLE_INCIDENT_PHOTOS.pothole);
  const [photoName, setPhotoName] = useState<string>('road_pothole_evidence.jpg');

  // GPS & Location
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [latitude, setLatitude] = useState<number>(28.6139);
  const [longitude, setLongitude] = useState<number>(77.2090);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [incidentTime, setIncidentTime] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);

  const standardEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const tenDigitPhoneRegex = /^\d{10}$/;

  const maxDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  useEffect(() => {
    if (isOpen) {
      setCreatedComplaint(null);
      setFormError(null);
      setName(citizenName);
      setEmail(citizenEmail);
      setPhone(citizenPhone.replace(/\D/g, '').slice(0, 10));

      const now = new Date();
      const offset = now.getTimezoneOffset();
      const local = new Date(now.getTime() - offset * 60 * 1000);
      setIncidentTime(local.toISOString().slice(0, 16));

      const dept = DEPARTMENTS[preferredService];
      if (dept && dept.typicalCategories.length > 0) {
        setCategory(dept.typicalCategories[0]);
      }

      // Check if we have a cached verified location
      const cached = getLastKnownLocation();
      if (cached) {
        setLatitude(cached.latitude);
        setLongitude(cached.longitude);
        setAccuracy(cached.accuracy);
        if (cached.address) setAddress(cached.address);
        if (cached.landmark) setLandmark(cached.landmark);
        if (cached.buildingName) setBuildingName(cached.buildingName);
        if (cached.street) setStreet(cached.street);
        if (cached.area) setArea(cached.area);
      }

      // Automatically acquire user's real exact GPS location and reverse geocode
      getExactUserLocation()
        .then((loc) => {
          setLatitude(loc.latitude);
          setLongitude(loc.longitude);
          setAccuracy(loc.accuracy);
          if (loc.address) setAddress(loc.address);
          if (loc.landmark) setLandmark(loc.landmark);
          if (loc.buildingName) setBuildingName(loc.buildingName);
          if (loc.street) setStreet(loc.street);
          if (loc.area) setArea(loc.area);
        })
        .catch((err) => {
          console.warn('Initial location acquisition notice:', err);
        });
    }
  }, [isOpen, citizenName, citizenEmail, citizenPhone]);

  const handleLocateAddressOnMap = async () => {
    if (!address.trim() || address.trim().length < 3) return;
    setIsGeocodingAddress(true);
    try {
      const result = await geocodeAddress(address);
      if (result) {
        setLatitude(result.latitude);
        setLongitude(result.longitude);
        setAccuracy(result.accuracy);
        if (result.landmark && !landmark) setLandmark(result.landmark);
      }
    } catch (e) {
      console.warn('Address geocoding error:', e);
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
  };

  const handleServiceChange = (service: ServiceDepartment) => {
    setPreferredService(service);
    const dept = DEPARTMENTS[service];
    if (dept && dept.typicalCategories.length > 0) {
      setCategory(dept.typicalCategories[0]);
    }
    if (service === 'police') {
      setPhotoUrl(SAMPLE_INCIDENT_PHOTOS.traffic);
      setPhotoName('traffic_violation_sample.jpg');
    } else if (service === 'rto') {
      setPhotoUrl(SAMPLE_INCIDENT_PHOTOS.traffic);
      setPhotoName('road_accident_sample.jpg');
    } else if (service === 'hospital') {
      setPhotoUrl(SAMPLE_INCIDENT_PHOTOS.ambulance);
      setPhotoName('medical_trauma_sample.jpg');
    } else if (service === 'fire') {
      setPhotoUrl(SAMPLE_INCIDENT_PHOTOS.fire);
      setPhotoName('fire_hazard_sample.jpg');
    } else {
      setPhotoUrl(SAMPLE_INCIDENT_PHOTOS.pothole);
      setPhotoName('road_pothole_sample.jpg');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFormError('Image size exceeds 10MB limit. Please upload a smaller image.');
        return;
      }
      setFormError(null);
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      setFormError('Reporter full name must be between 2 and 60 characters.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone || !tenDigitPhoneRegex.test(trimmedPhone)) {
      setFormError('Please enter a valid 10-digit mobile number (digits only).');
      return;
    }

    const trimmedEmail = email.trim();
    if (!standardEmailRegex.test(trimmedEmail)) {
      setFormError('Please enter a valid email address with a standard domain (e.g. name@example.com).');
      return;
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 5 || trimmedTitle.length > 120) {
      setFormError('Incident title must be between 5 and 120 characters.');
      return;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc.length < 15 || trimmedDesc.length > 1000) {
      setFormError('Detailed description must be between 15 and 1000 characters to provide sufficient context.');
      return;
    }

    const trimmedAddress = address.trim();
    if (trimmedAddress.length < 5 || trimmedAddress.length > 200) {
      setFormError('Incident address must be between 5 and 200 characters.');
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setFormError('Latitude must be between -90 and 90, and Longitude between -180 and 180.');
      return;
    }

    setIsSubmitting(true);

    const isEmergency = isEmergencyPriority || severity === 'critical';

    (async () => {
      let trackingId: string | undefined;
      try {
        // 1. Submit complaint to FastAPI backend (POST /complaints)
        const backendRes = await submitComplaint({
          citizen_name: trimmedName,
          contact: trimmedPhone,
          complaint: `${trimmedTitle}\n\n${trimmedDesc}`,
          address: trimmedAddress,
          latitude,
          longitude
        });

        trackingId = backendRes.tracking_id;

        // 2. Trigger Lyzr / AI Agent analysis (POST /complaints/{tracking_id}/analyze)
        await triggerAIAnalysis(backendRes.tracking_id);

        // 3. Route to nearest zonal departments with Haversine computation & external tickets (POST /complaints/{tracking_id}/route)
        await routeComplaint(backendRes.tracking_id);
      } catch (apiErr) {
        console.warn('FastAPI backend integration call notice:', apiErr);
      }

      // Local synchronized registry
      const complaint = registerNewComplaint({
        id: trackingId, // Sync with backend tracking ID if available
        title: trimmedTitle,
        description: trimmedDesc,
        category: category || DEPARTMENTS[preferredService].typicalCategories[0] || 'General Civic Incident',
        preferredService,
        severity: isEmergency ? 'critical' : severity,
        photos: [photoUrl],
        location: {
          latitude,
          longitude,
          address: trimmedAddress,
          landmark: landmark.trim() || undefined,
          accuracy: 5
        },
        timestamp: incidentTime ? new Date(incidentTime).toISOString() : new Date().toISOString(),
        citizenName: trimmedName,
        citizenPhone: trimmedPhone,
        citizenEmail: trimmedEmail,
        isEmergencySOS: isEmergency
      });

      if (isEmergency) {
        playEmergencySiren();
      }

      setCreatedComplaint(complaint);
      setIsSubmitting(false);
      if (onComplaintCreated) onComplaintCreated(complaint);
    })();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-slate-900">
        
        {/* Sticky Header */}
        <div className="bg-slate-50 px-5 sm:px-7 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-['Outfit'] truncate">
                Register Grievance & Incident Report
              </h2>
              <p className="text-xs text-slate-500 truncate">
                Attach photo evidence, GPS location & send ringing dispatch
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">
          
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2.5 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {createdComplaint ? (
            /* Confirmation Success Card */
            <div className="py-6 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-['Outfit']">
                Complaint Registered & Dispatched!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Ticket <code className="text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{createdComplaint.id}</code> has been registered and forwarded to <strong>{DEPARTMENTS[createdComplaint.preferredService]?.name}</strong>.
              </p>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left text-xs sm:text-sm space-y-2.5 max-w-lg mx-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Preferred Service:</span>
                  <span className="font-bold text-slate-900 uppercase">{createdComplaint.preferredService}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ringing Alert:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Volume2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                    Dispatched to Desk
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between text-slate-600 gap-1">
                  <span>GPS Location:</span>
                  <span className="text-indigo-700 font-mono text-xs">{createdComplaint.location.address}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Reporter:</span>
                  <span className="text-slate-900 font-medium">{createdComplaint.citizenName} ({createdComplaint.citizenPhone})</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>Initial Status:</span>
                  <span className="text-amber-700 font-bold">0% Registered (Queued)</span>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
                >
                  Return to Dashboard & Track Status
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* 1. CITIZEN CREDENTIALS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  <span>1. Citizen / Reporter Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        placeholder="Your full name"
                        required
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
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        placeholder="10-digit number"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">{phone.length}/10 digits</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        placeholder="name@domain.com"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Standard domain (.com, .gov, .org, .in)</span>
                  </div>
                </div>
              </div>

              {/* 2. PREFERRED SERVICE & INCIDENT DETAILS */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    2. Select Preferred Service Department (For Ringing Dispatch) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['municipal', 'police', 'rto', 'hospital', 'fire'] as ServiceDepartment[]).map((service) => {
                      const info = DEPARTMENTS[service];
                      const active = preferredService === service;
                      return (
                        <button
                          key={service}
                          type="button"
                          onClick={() => handleServiceChange(service)}
                          className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1.5 cursor-pointer ${
                            active
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold shadow-sm ring-2 ring-indigo-500/20'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {service === 'police' && <ShieldAlert className="w-5 h-5 text-blue-600" />}
                          {service === 'rto' && <Car className="w-5 h-5 text-amber-600" />}
                          {service === 'hospital' && <HeartPulse className="w-5 h-5 text-emerald-600" />}
                          {service === 'fire' && <Flame className="w-5 h-5 text-rose-600" />}
                          {service === 'municipal' && <Building2 className="w-5 h-5 text-teal-600" />}
                          <span className="text-xs font-bold capitalize">{info.shortName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category & Severity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Incident Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    >
                      {DEPARTMENTS[preferredService].typicalCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Other / General Civic Issue">Other / General Civic Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Severity Level
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['low', 'medium', 'high', 'critical'] as ComplaintSeverity[]).map((sev) => {
                        const active = severity === sev;
                        return (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => setSeverity(sev)}
                            className={`py-2 text-xs font-bold rounded-xl border uppercase transition cursor-pointer ${
                              active 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {sev}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Incident Title / Summary <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-mono text-slate-400">
                        {title.length}/120
                      </span>
                    </div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      minLength={5}
                      maxLength={120}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
                      placeholder="e.g. Hazardous deep pothole on arterial road"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Detailed Description of Incident <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-mono text-slate-400">
                        {description.length}/1000
                      </span>
                    </div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      minLength={15}
                      maxLength={1000}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
                      placeholder="Provide full description: location condition, risk to traffic/pedestrians (min 15 chars)..."
                      required
                    />
                  </div>
                </div>

                {/* Emergency Priority Toggle */}
                <div 
                  onClick={() => setIsEmergencyPriority(!isEmergencyPriority)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    isEmergencyPriority
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl shrink-0 ${isEmergencyPriority ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-600'}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Mark as Emergency Priority</p>
                      <p className="text-[11px] text-slate-500">Rings urgent alarm & triggers fast dispatch to {preferredService.toUpperCase()}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEmergencyPriority}
                    onChange={() => {}}
                    className="w-5 h-5 accent-rose-600 rounded cursor-pointer shrink-0"
                  />
                </div>
              </div>

              {/* 3. PICS FOR EVIDENCE */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    3. Pics for Evidence (Photo Upload / Camera) <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Max 10MB</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-5 relative aspect-video bg-slate-100 rounded-xl border border-slate-200 overflow-hidden group">
                    <img
                      src={photoUrl}
                      alt="Evidence Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs text-white font-bold p-2 text-center">
                      {photoName}
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-3">
                    <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition">
                      <Upload className="w-4 h-4" />
                      <span>Upload Incident Photo / File</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1.5">Or Choose Quick Evidence Template:</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoUrl(SAMPLE_INCIDENT_PHOTOS.pothole);
                            setPhotoName('road_pothole_sample.jpg');
                          }}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 shadow-xs cursor-pointer"
                        >
                          Pothole
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoUrl(SAMPLE_INCIDENT_PHOTOS.garbage);
                            setPhotoName('garbage_dump_sample.jpg');
                          }}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 shadow-xs cursor-pointer"
                        >
                          Garbage
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoUrl(SAMPLE_INCIDENT_PHOTOS.traffic);
                            setPhotoName('traffic_sample.jpg');
                          }}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 shadow-xs cursor-pointer"
                        >
                          Traffic
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoUrl(SAMPLE_INCIDENT_PHOTOS.fire);
                            setPhotoName('fire_outbreak_sample.jpg');
                          }}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-white text-slate-700 hover:text-indigo-600 border border-slate-200 shadow-xs cursor-pointer"
                        >
                          Fire
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. GPS FOR EXACT LOCATION & TIMESTAMP */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>4. Exact GPS Incident Pinpoint & Time <span className="text-rose-500">*</span></span>
                </div>

                {/* Interactive Map & Precision GPS Picker */}
                <LocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  address={address}
                  landmark={landmark}
                  buildingName={buildingName}
                  street={street}
                  area={area}
                  accuracy={accuracy}
                  accentColor="indigo"
                  onChange={(data) => {
                    setLatitude(data.latitude);
                    setLongitude(data.longitude);
                    setAddress(data.address);
                    setLandmark(data.landmark);
                    if (data.buildingName !== undefined) setBuildingName(data.buildingName);
                    if (data.street !== undefined) setStreet(data.street);
                    if (data.area !== undefined) setArea(data.area);
                    if (data.accuracy) setAccuracy(data.accuracy);
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Incident Street / Building Address <span className="text-rose-500">*</span>
                      </label>
                      {address.trim().length >= 3 && (
                        <button
                          type="button"
                          onClick={handleLocateAddressOnMap}
                          disabled={isGeocodingAddress}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Search className="w-3 h-3" />
                          <span>{isGeocodingAddress ? 'Locating...' : 'Find on Map'}</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        minLength={5}
                        maxLength={200}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        placeholder="e.g. Shop 4, Golden Arcade, 100 Ft Road, Sector 18"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prominent Landmark <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      maxLength={100}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      placeholder="e.g. Opposite Metro Pillar 142 / Near City Hospital"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Exact Incident Date & Time <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="datetime-local"
                    value={incidentTime}
                    max={maxDateTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON WITH RINGING DISPATCH */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 transition disabled:opacity-50 cursor-pointer"
                  id="submit-complaint-btn"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5 text-amber-300 animate-pulse" />
                      <span>Register Complaint & Ring Preferred Service Desk</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
