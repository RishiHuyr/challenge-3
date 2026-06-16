const API_BASE_URL = 'http://localhost:5000/api';

export const getCookieValue = (name: string): string => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : '';
};

export class APIError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Set credentials for session cookie exchange
  const config: RequestInit = {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    } as Record<string, string>,
  };

  // Add CSRF validation token header for write requests
  const method = config.method ? config.method.toUpperCase() : 'GET';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCookieValue('XSRF-TOKEN');
    if (csrfToken) {
      (config.headers as Record<string, string>)['x-xsrf-token'] = csrfToken;
    }
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new APIError(
        data.message || 'Something went wrong',
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error: any) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(error.message || 'Network connectivity issue', 500);
  }
}
