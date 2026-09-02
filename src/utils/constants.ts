import { DepartmentInfo, ServiceDepartment, UserRole, UserSession } from '../types';

export const DEPARTMENTS: Record<ServiceDepartment, DepartmentInfo> = {
  police: {
    id: 'police',
    name: 'Police Department',
    shortName: 'Police',
    iconName: 'ShieldAlert',
    color: 'text-blue-700',
    accentBg: 'from-blue-50 via-slate-50 to-white border-blue-200 text-blue-900',
    accentBorder: 'border-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Law enforcement, crime prevention, emergency response & public order maintenance.',
    helpline: '100 / 112',
    typicalCategories: ['Theft & Robbery', 'Physical Violence', 'Harassment', 'Vandalism', 'Suspicious Activity', 'Cyber Fraud', 'Missing Person'],
    defaultOfficer: 'Insp. Rajesh Kumar (Badge #POL-409)'
  },
  rto: {
    id: 'rto',
    name: 'Regional Transport Office (RTO)',
    shortName: 'RTO',
    iconName: 'Car',
    color: 'text-amber-700',
    accentBg: 'from-amber-50 via-slate-50 to-white border-amber-200 text-amber-900',
    accentBorder: 'border-amber-500',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Traffic regulations, illegal parking, road safety compliance & vehicle transport control.',
    helpline: '1073 / 1800-425-RTO',
    typicalCategories: ['Illegal Parking', 'Traffic Signal Breakdown', 'Reckless Driving', 'Unlicensed Commercial Vehicle', 'Overloading', 'Hit & Run Vehicle Tracking'],
    defaultOfficer: 'Officer Vikramaditya (RTO Insp #RTO-882)'
  },
  hospital: {
    id: 'hospital',
    name: 'Hospital & Emergency Medical Services (EMS)',
    shortName: 'Hospital / EMS',
    iconName: 'HeartPulse',
    color: 'text-emerald-700',
    accentBg: 'from-emerald-50 via-slate-50 to-white border-emerald-200 text-emerald-900',
    accentBorder: 'border-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Critical medical care, ambulance dispatch, trauma response & patient life support.',
    helpline: '102 / 108',
    typicalCategories: ['Severe Medical Emergency', 'Road Accident Trauma', 'Cardiac / Respiratory Attack', 'Maternity Emergency', 'Poisoning / Overdose', 'Industrial Injury'],
    defaultOfficer: 'Dr. Ananya Sharma (EMS Chief #EMS-104)'
  },
  fire: {
    id: 'fire',
    name: 'Fire & Rescue Services',
    shortName: 'Fire & Rescue',
    iconName: 'Flame',
    color: 'text-rose-700',
    accentBg: 'from-rose-50 via-slate-50 to-white border-rose-200 text-rose-900',
    accentBorder: 'border-rose-500',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    description: 'Fire suppression, building collapse rescue, hazardous gas leaks & flood evacuation.',
    helpline: '101',
    typicalCategories: ['Building Fire Outbreak', 'Chemical / Gas Leakage', 'Structural Collapse', 'Electrical Short Circuit Hazard', 'Animal / Human Height Rescue', 'Flood Evacuation'],
    defaultOfficer: 'Chief Marshal K. S. Rathore (#FIR-521)'
  },
  municipal: {
    id: 'municipal',
    name: 'Municipal Corporation',
    shortName: 'Municipal Corp',
    iconName: 'Building2',
    color: 'text-teal-700',
    accentBg: 'from-teal-50 via-slate-50 to-white border-teal-200 text-teal-900',
    accentBorder: 'border-teal-500',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    description: 'Public sanitation, broken water pipelines, road potholes, streetlight repairs & garbage management.',
    helpline: '1916 / 1800-112-MC',
    typicalCategories: ['Garbage Overflow & Dumping', 'Damaged Roads & Potholes', 'Sewage Overflow', 'Broken Streetlights', 'Drinking Water Pipe Leak', 'Stray Cattle / Animals', 'Illegal Construction'],
    defaultOfficer: 'Eng. S. Mukherjee (Zonal MC #MNC-930)'
  }
};

// Sample realistic civic & emergency evidence photos
export const SAMPLE_INCIDENT_PHOTOS = {
  pothole: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
  fire: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=600&auto=format&fit=crop&q=80",
  traffic: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80",
  accident: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80",
  ambulance: "https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=600&auto=format&fit=crop&q=80",
  streetLight: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80",
  garbage: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80"
};
