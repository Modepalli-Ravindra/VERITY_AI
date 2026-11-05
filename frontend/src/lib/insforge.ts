/**
 * VERITY SQLite Client Layer
 * Replaces InsForge BaaS with direct local SQLite backend integration.
 * Fully decoupled from cloud dependencies.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const parseJwtPayload = (token: string): any => {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    let base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string, skewSeconds = 30): boolean => {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload) return true;
  if (typeof payload.exp !== 'number') {
    return !payload.sub;
  }
  const now = Math.floor(Date.now() / 1000);
  return now >= (payload.exp - skewSeconds);
};

let inMemoryToken: string | null = null;

export const saveAuthTokens = (accessToken?: string | null, refreshToken?: string | null) => {
  if (accessToken) {
    inMemoryToken = accessToken;
    try {
      localStorage.setItem('verity_access_token', accessToken);
    } catch {}
  }
  if (refreshToken) {
    try {
      localStorage.setItem('verity_refresh_token', refreshToken);
    } catch {}
  }
};

export const clearAuthTokens = () => {
  inMemoryToken = null;
  try {
    localStorage.removeItem('verity_access_token');
    localStorage.removeItem('verity_refresh_token');
  } catch {}
};

export const getAuthToken = async (): Promise<string | null> => {
  if (inMemoryToken && !isTokenExpired(inMemoryToken)) {
    return inMemoryToken;
  }
  try {
    const stored = localStorage.getItem('verity_access_token');
    if (stored && !isTokenExpired(stored)) {
      inMemoryToken = stored;
      return stored;
    }
  } catch {}

  // Guest token fallback for unauthenticated workspace access
  try {
    let guestId = localStorage.getItem('verity_guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('verity_guest_id', guestId);
    }
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({
      sub: guestId,
      email: 'guest@verity.local',
      role: 'guest',
      exp: Math.floor(Date.now() / 1000) + 86400 * 365
    }));
    const guestToken = `${header}.${payload}.sig`;
    saveAuthTokens(guestToken);
    return guestToken;
  } catch {
    return null;
  }
};

class SQLiteQueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private conditions: { field: string; value: any }[] = [];
  private limitCount?: number;
  private insertData?: any;
  private updateData?: any;

  constructor(table: string) {
    this.table = table;
  }

  select(_fields = '*') {
    this.action = 'select';
    return this;
  }

  insert(records: any[]) {
    this.action = 'insert';
    this.insertData = records;
    return this.execute();
  }

  upsert(records: any[]) {
    this.action = 'insert';
    this.insertData = records;
    return this.execute();
  }

  update(fields: any) {
    this.action = 'update';
    this.updateData = fields;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this.conditions.push({ field, value });
    return this;
  }

  order(field: string, opts?: { ascending?: boolean }) {
    void field; void opts;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async maybeSingle(): Promise<{ data: any | null; error: any | null }> {
    const res = await this.execute();
    if (res.error) return { data: null, error: res.error };
    if (Array.isArray(res.data) && res.data.length > 0) {
      return { data: res.data[0], error: null };
    }
    return { data: res.data || null, error: null };
  }

  async single(): Promise<{ data: any | null; error: any | null }> {
    return this.maybeSingle();
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (this.action === 'insert') {
        const url = `${API_BASE_URL}/${this.table}`;
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(this.insertData)
        });
        const json = await res.json();
        return { data: json.data, error: json.error || null };
      }

      if (this.action === 'select') {
        const queryParams = new URLSearchParams();
        if (this.limitCount) queryParams.set('limit', String(this.limitCount));
        const url = `${API_BASE_URL}/${this.table}?${queryParams.toString()}`;
        const res = await fetch(url, { method: 'GET', headers });
        const json = await res.json();
        return { data: json.data || [], error: json.error || null };
      }

      if (this.action === 'delete') {
        const idCond = this.conditions.find(c => c.field === 'id');
        const url = idCond
          ? `${API_BASE_URL}/${this.table}/${idCond.value}`
          : `${API_BASE_URL}/${this.table}`;
        const res = await fetch(url, { method: 'DELETE', headers });
        const json = await res.json();
        return { data: json.data, error: json.error || null };
      }

      if (this.action === 'update') {
        const url = `${API_BASE_URL}/${this.table}`;
        const res = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(this.updateData)
        });
        const json = await res.json();
        return { data: json.data, error: json.error || null };
      }

      return { data: null, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'SQLite API request failed' } };
    }
  }
}

export const insforge = {
  setAccessToken: (token: string | null) => {
    inMemoryToken = token;
  },
  getHttpClient: () => ({
    setRefreshToken: (_token: string | null) => {
    }
  }),
  tokenManager: {
    getAccessToken: () => inMemoryToken
  },
  auth: {
    signUp: async ({ email, password, name }: { email: string; password: string; name?: string }) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName: name, name })
        });
        return await res.json();
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        return await res.json();
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    },
    verifyEmail: async ({ email, otp }: { email: string; otp?: string }) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        });
        return await res.json();
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    },
    resendVerificationEmail: async ({ email }: { email: string }) => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/resend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        return await res.json();
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    },
    getCurrentUser: async () => {
      try {
        const token = await getAuthToken();
        if (!token) return { data: null, error: null };
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        return await res.json();
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    updateUser: async ({ data }: { data: any }) => {
      try {
        const token = await getAuthToken();
        const res = await fetch(`${API_BASE_URL}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            full_name: data.full_name || data.name || '',
            display_name: data.display_name || data.name || ''
          })
        });
        return await res.json();
      } catch (err: any) {
        return { error: { message: err.message } };
      }
    },
    refreshSession: async ({ refreshToken: _refreshToken }: { refreshToken?: string } = {}) => {
      const token = inMemoryToken || localStorage.getItem('verity_access_token');
      return { data: { accessToken: token, refreshToken: token }, error: null };
    },
    signOut: async () => {
      clearAuthTokens();
      try {
        await fetch(`${API_BASE_URL}/auth/signout`, { method: 'POST' });
      } catch {}
      return { data: null, error: null };
    }
  },
  database: {
    from: (table: string) => new SQLiteQueryBuilder(table)
  }
};

if (typeof window !== 'undefined') {
  (window as any).__clearVerityTokens = clearAuthTokens;
  (window as any).__getVerityToken = getAuthToken;
}
