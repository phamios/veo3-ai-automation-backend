# Phase 1: API Client Setup

**Duration**: 2 hours
**Dependencies**: None
**Risk**: Low

## Objectives

- Configure Vite dev server proxy
- Create base HTTP client with fetch
- Implement request/response interceptors
- Add error handling utilities
- Setup TypeScript types for API responses

## Tasks

### 1. Configure Vite Proxy (15 min)

**File**: `frontend/vite.config.ts`

**Changes**:
```typescript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    // ... rest of config
  };
});
```

**Why**: Avoid CORS issues in development, seamless API calls

### 2. Create API Types (20 min)

**File**: `frontend/types/api.types.ts` (new)

**Content**:
```typescript
// API Response wrappers
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Auth DTOs
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// Order DTOs
export interface CreateOrderDto {
  packageId: string;
}

export interface ConfirmPaymentDto {
  transferContent?: string;
}

// Admin DTOs
export interface ApproveOrderDto {
  licenseKey: string;
  downloadLink: string;
}

export interface RejectOrderDto {
  reason: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  newUsers: number;
}
```

### 3. Create Error Handler Utility (25 min)

**File**: `frontend/utils/errorHandler.ts` (new)

**Content**:
```typescript
import { ApiError } from '../types/api.types';

export class ApiException extends Error {
  statusCode: number;
  errors: string[];

  constructor(statusCode: number, message: string | string[]) {
    const msg = Array.isArray(message) ? message.join(', ') : message;
    super(msg);
    this.statusCode = statusCode;
    this.errors = Array.isArray(message) ? message : [message];
    this.name = 'ApiException';
  }
}

export const handleApiError = (error: unknown): never => {
  // Network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new ApiException(0, 'Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng.');
  }

  // API error response
  if (error instanceof Response) {
    throw new ApiException(
      error.status,
      error.statusText || 'Đã xảy ra lỗi không xác định'
    );
  }

  // Already an ApiException
  if (error instanceof ApiException) {
    throw error;
  }

  // Unknown error
  throw new ApiException(500, 'Đã xảy ra lỗi không xác định');
};

export const isUnauthorized = (error: unknown): boolean => {
  return error instanceof ApiException && error.statusCode === 401;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiException) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Đã xảy ra lỗi không xác định';
};
```

### 4. Create Base API Client (45 min)

**File**: `frontend/services/apiClient.ts` (new)

**Content**:
```typescript
import { ApiException } from '../utils/errorHandler';

class ApiClient {
  private baseURL = '/api'; // Proxy handles this
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Merge headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    // Add auth token if exists
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Send cookies (refresh token)
    };

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      if (!response.ok) {
        if (isJson) {
          const errorData = await response.json();
          throw new ApiException(
            response.status,
            errorData.message || response.statusText
          );
        }
        throw new ApiException(response.status, response.statusText);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      // Parse JSON response
      if (isJson) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      // Network errors
      if (error instanceof TypeError) {
        throw new ApiException(
          0,
          'Không thể kết nối tới server. Kiểm tra kết nối mạng.'
        );
      }
      // Re-throw ApiException
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

**Key features**:
- Singleton instance
- Auto-inject JWT token
- Credentials: 'include' for cookies
- Proper error handling
- TypeScript generics for type safety

### 5. Test API Client (15 min)

**Manual test**:
1. Start backend: `cd backend && npm run start:dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser console
4. Test proxy:
   ```javascript
   fetch('/api/packages').then(r => r.json()).then(console.log)
   ```
5. Should return packages array from backend

## Verification Checklist

- [ ] Vite proxy configured in vite.config.ts
- [ ] API types defined in types/api.types.ts
- [ ] Error handler utility created
- [ ] Base API client created
- [ ] Proxy working (test with fetch in console)
- [ ] No TypeScript errors

## Files Created

1. `frontend/types/api.types.ts`
2. `frontend/utils/errorHandler.ts`
3. `frontend/services/apiClient.ts`

## Files Modified

1. `frontend/vite.config.ts`

## Common Issues

**Issue**: CORS errors despite proxy
- **Fix**: Ensure backend CORS configured for `http://localhost:3000`
- **Backend check**: `main.ts` should have `app.enableCors({ origin: 'http://localhost:3000', credentials: true })`

**Issue**: 404 on `/api/*` routes
- **Fix**: Verify backend running on port 3001
- **Fix**: Check backend has `/api` prefix in routes

**Issue**: Credentials not sent
- **Fix**: Ensure `credentials: 'include'` in fetch config

## Next Phase

Proceed to **Phase 2: Auth Integration** after verification complete.
