import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { UserRole, UserSession } from '../types';

// Environment variables for client-side Supabase
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

/**
 * Returns true if real Supabase environment variables are provided
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co' && !supabaseUrl.includes('your-project'));
}

/**
 * Lazy initialization of Supabase Client
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClient) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      supabaseClient = null;
    }
  }
  return supabaseClient;
}

/**
 * Sign up a new user using Supabase Auth with custom role metadata
 */
export async function signUpWithSupabase(params: {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  badgeNumber?: string;
}): Promise<{ success: boolean; session?: UserSession; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { 
      success: false, 
      error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' 
    };
  }

  try {
    const { data, error } = await client.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.name,
          phone: params.phone,
          role: params.role,
          badge_number: params.badgeNumber || null,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const user = data.user;
    if (!user) {
      return { success: false, error: 'Registration succeeded, but no user record was returned.' };
    }

    const isDept = (['police', 'rto', 'hospital', 'fire', 'municipal'] as UserRole[]).includes(params.role);
    const department = isDept ? (params.role as any) : undefined;

    const session: UserSession = {
      id: user.id,
      name: params.name,
      email: user.email || params.email,
      phone: params.phone,
      role: params.role,
      badgeNumber: params.badgeNumber,
      department,
      token: data.session?.access_token || `token-${Date.now()}`,
    };

    return { success: true, session };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred during Supabase signup.' };
  }
}

/**
 * Sign in existing user using Supabase Auth
 */
export async function signInWithSupabase(
  email: string,
  password: string
): Promise<{ success: boolean; session?: UserSession; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { 
      success: false, 
      error: 'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' 
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const user = data.user;
    if (!user) {
      return { success: false, error: 'No user record returned by Supabase.' };
    }

    const meta = user.user_metadata || {};
    const role: UserRole = meta.role || 'citizen';
    const name: string = meta.full_name || user.email?.split('@')[0] || 'Civic User';
    const isDept = (['police', 'rto', 'hospital', 'fire', 'municipal'] as UserRole[]).includes(role);
    const department = isDept ? (role as any) : undefined;

    const session: UserSession = {
      id: user.id,
      name,
      email: user.email || email,
      phone: meta.phone || '+91 9876543210',
      role,
      badgeNumber: meta.badge_number,
      department,
      token: data.session?.access_token || `token-${Date.now()}`,
    };

    return { success: true, session };
  } catch (err: any) {
    return { success: false, error: err.message || 'An error occurred during Supabase signin.' };
  }
}

/**
 * Sign out of Supabase
 */
export async function signOutSupabase(): Promise<void> {
  const client = getSupabase();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
  }
}

/**
 * Get current active session from Supabase
 */
export async function getSupabaseSession(): Promise<UserSession | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data } = await client.auth.getSession();
    const session = data?.session;
    if (!session || !session.user) return null;

    const user = session.user;
    const meta = user.user_metadata || {};
    const role: UserRole = (meta.role as UserRole) || 'citizen';
    const isDept = (['police', 'rto', 'hospital', 'fire', 'municipal'] as UserRole[]).includes(role);
    const department = isDept ? (role as any) : undefined;

    return {
      id: user.id,
      name: meta.full_name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      phone: meta.phone || '',
      role,
      badgeNumber: meta.badge_number,
      department,
      token: session.access_token,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Supabase Database Table Helpers (Matching Schema.sql)
// ---------------------------------------------------------------------------

export interface SupabaseDepartment {
  id: string;
  name: string;
  code: string;
  department_type: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  api_endpoint: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SupabaseComplaintRoute {
  id: string;
  complaint_id: string;
  department_id: string;
  department_type: string;
  status: string;
  external_ticket_id: string | null;
  distance_km: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseTrackingEvent {
  id: string;
  complaint_id: string;
  route_id: string | null;
  status: string;
  message: string;
  created_at: string;
}

/**
 * Fetch all registered departments directly from Supabase DB
 */
export async function fetchSupabaseDepartments(): Promise<SupabaseDepartment[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetch departments error:', error.message);
      return null;
    }
    return data as SupabaseDepartment[];
  } catch (err) {
    console.warn('Supabase DB error:', err);
    return null;
  }
}

/**
 * Fetch complaint routes directly from Supabase DB
 */
export async function fetchSupabaseRoutes(complaintId: string): Promise<SupabaseComplaintRoute[] | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('complaint_routes')
      .select('*')
      .eq('complaint_id', complaintId);

    if (error) return null;
    return data as SupabaseComplaintRoute[];
  } catch {
    return null;
  }
}

/**
 * Get configuration metadata for diagnostics UI
 */
export function getSupabaseConfigInfo() {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const isConfigured = isSupabaseConfigured();
  
  let maskedKey = 'Not Set';
  if (key) {
    maskedKey = key.length > 10 ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : 'Set (hidden)';
  }

  return {
    url: url || 'Not Set',
    maskedKey,
    isConfigured,
    hasValidUrlPattern: Boolean(url && url.startsWith('https://') && url.includes('.supabase.co')),
    hasValidKeyPattern: Boolean(key && key.startsWith('ey') && key.length > 30),
  };
}

export interface SupabaseDiagnosticResult {
  isConfigured: boolean;
  url: string;
  authConnected: boolean;
  dbConnected: boolean;
  authError?: string;
  dbError?: string;
  tablesFound?: {
    departments: boolean;
    complaints: boolean;
    complaint_routes: boolean;
    tracking_events: boolean;
  };
  details: string[];
}

/**
 * Perform a live check against Supabase Auth & Database
 */
export async function diagnoseSupabaseConnection(): Promise<SupabaseDiagnosticResult> {
  const config = getSupabaseConfigInfo();
  const details: string[] = [];

  if (!config.isConfigured) {
    return {
      isConfigured: false,
      url: config.url,
      authConnected: false,
      dbConnected: false,
      authError: 'Environment variables VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are missing or have placeholder values.',
      details: [
        'VITE_SUPABASE_URL: ' + (config.url || 'Missing'),
        'VITE_SUPABASE_ANON_KEY: ' + config.maskedKey,
        'Please add your real project keys to .env'
      ]
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      isConfigured: false,
      url: config.url,
      authConnected: false,
      dbConnected: false,
      authError: 'Failed to initialize Supabase client instance.',
      details: ['Client initialization failed.']
    };
  }

  let authConnected = false;
  let authError: string | undefined;
  let dbConnected = false;
  let dbError: string | undefined;
  const tables = {
    departments: false,
    complaints: false,
    complaint_routes: false,
    tracking_events: false,
  };

  // 1. Check Auth connection
  try {
    const { error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      authError = sessionError.message;
      details.push(`Auth check warning: ${sessionError.message}`);
    } else {
      authConnected = true;
      details.push('Auth endpoint responded successfully.');
    }
  } catch (err: any) {
    authError = err.message || 'Auth check threw an exception.';
    details.push(`Auth check failed: ${authError}`);
  }

  // 2. Check Database tables
  try {
    const { data: deptData, error: deptErr } = await client.from('departments').select('id').limit(1);
    if (!deptErr) {
      tables.departments = true;
      dbConnected = true;
      details.push(`Table 'departments' accessible (${deptData?.length ?? 0} sample rows checked).`);
    } else {
      details.push(`Table 'departments' check: ${deptErr.message}`);
    }

    const { error: compErr } = await client.from('complaints').select('id').limit(1);
    if (!compErr) {
      tables.complaints = true;
      dbConnected = true;
      details.push("Table 'complaints' accessible.");
    } else {
      details.push(`Table 'complaints' check: ${compErr.message}`);
    }

    const { error: routeErr } = await client.from('complaint_routes').select('id').limit(1);
    if (!routeErr) {
      tables.complaint_routes = true;
      details.push("Table 'complaint_routes' accessible.");
    }

    const { error: trackErr } = await client.from('tracking_events').select('id').limit(1);
    if (!trackErr) {
      tables.tracking_events = true;
      details.push("Table 'tracking_events' accessible.");
    }

    if (!dbConnected) {
      dbError = deptErr?.message || compErr?.message || 'Tables could not be queried.';
    }
  } catch (err: any) {
    dbError = err.message || 'Database query exception.';
    details.push(`DB check failed: ${dbError}`);
  }

  return {
    isConfigured: true,
    url: config.url,
    authConnected,
    dbConnected,
    authError,
    dbError,
    tablesFound: tables,
    details
  };
}

