# Phase 2: Auth Integration

**Duration**: 2-3 hours
**Dependencies**: Phase 1 complete
**Risk**: Medium

## Objectives

- Replace authService with real API calls
- Implement JWT token management
- Session validation with backend
- Handle 401 auto-logout
- Remove localStorage for sensitive data

## Backend Endpoints

```
POST   /api/auth/register       - Create new user
POST   /api/auth/login          - Login, returns { user, accessToken }
POST   /api/auth/logout         - Logout, invalidate session
GET    /api/auth/me             - Get current user (requires auth)
GET    /api/auth/session/status - Validate current session
```

## Tasks

### 1. Create Auth API Service (45 min)

**File**: `frontend/services/api/auth.api.ts` (new)

**Content**:
```typescript
import { apiClient } from '../apiClient';
import {
  RegisterDto,
  LoginDto,
  AuthResponse,
} from '../../types/api.types';
import { User } from '../../types';

export const authApi = {
  /**
   * Register new user
   */
  register: async (dto: RegisterDto): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/register', dto);
  },

  /**
   * Login user
   * Returns access token + user data
   * Backend sets refresh token as httpOnly cookie
   */
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', dto);

    // Store access token in API client memory
    if (response.accessToken) {
      apiClient.setAccessToken(response.accessToken);
    }

    return response;
  },

  /**
   * Logout current user
   * Invalidates session on backend
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      // Always clear token, even if request fails
      apiClient.setAccessToken(null);
    }
  },

  /**
   * Get current authenticated user
   */
  getMe: async (): Promise<User> => {
    return apiClient.get<User>('/auth/me');
  },

  /**
   * Validate current session
   * Backend checks if session is still valid (single session enforcement)
   */
  validateSession: async (): Promise<boolean> => {
    try {
      await apiClient.get('/auth/session/status');
      return true;
    } catch (error: any) {
      // 401 = session invalid
      if (error.statusCode === 401) {
        return false;
      }
      // Other errors don't mean invalid session
      return true;
    }
  },
};
```

### 2. Create Auth Hook (30 min)

**File**: `frontend/hooks/useAuth.ts` (new)

**Content**:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api/auth.api';
import { User, UserRole } from '../types';
import { LoginDto, RegisterDto } from '../types/api.types';
import { ApiException } from '../utils/errorHandler';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  loginAsAdmin: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize: Check if user is logged in
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authApi.getMe();
        setUser(currentUser);
      } catch (err) {
        // Not logged in or token expired
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Session validation polling (every 30s)
  useEffect(() => {
    if (!user) return;

    const validateInterval = setInterval(async () => {
      const isValid = await authApi.validateSession();
      if (!isValid) {
        // Session invalidated by backend (another login)
        setUser(null);
        setError('Phiên đăng nhập hết hạn. Tài khoản đã được đăng nhập trên thiết bị khác.');
      }
    }, 30000); // 30 seconds

    return () => clearInterval(validateInterval);
  }, [user]);

  const login = useCallback(async (dto: LoginDto) => {
    try {
      setLoading(true);
      setError(null);
      const { user: loggedInUser } = await authApi.login(dto);
      setUser(loggedInUser);
    } catch (err) {
      const message = err instanceof ApiException
        ? err.message
        : 'Đăng nhập thất bại';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (dto: RegisterDto) => {
    try {
      setLoading(true);
      setError(null);
      const { user: newUser } = await authApi.register(dto);
      setUser(newUser);
    } catch (err) {
      const message = err instanceof ApiException
        ? err.message
        : 'Đăng ký thất bại';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authApi.logout();
    } finally {
      setUser(null);
      setError(null);
      setLoading(false);
    }
  }, []);

  // Dev helper: Login as admin (mock credentials)
  const loginAsAdmin = useCallback(async () => {
    // Use real admin credentials from backend seed data
    await login({ email: 'admin@veo3.ai', password: 'admin123' });
  }, [login]);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    loginAsAdmin,
    isAuthenticated: !!user,
    isAdmin: user?.role === UserRole.ADMIN,
  };
};
```

### 3. Update App Component (45 min)

**File**: `frontend/index.tsx`

**Changes**:
```typescript
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Checkout from './components/Checkout';
import AdminDashboard from './components/AdminDashboard';
import { Package } from './types';
import { useAuth } from './hooks/useAuth';

const App = () => {
  const { user, loading, error, logout, loginAsAdmin, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState<'LANDING' | 'DASHBOARD' | 'CHECKOUT' | 'ADMIN'>('LANDING');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // Update view when user changes
  useEffect(() => {
    if (user) {
      setCurrentView(isAdmin ? 'ADMIN' : 'DASHBOARD');
    } else {
      setCurrentView('LANDING');
    }
  }, [user, isAdmin]);

  const handleLogout = async () => {
    await logout();
    setCurrentView('LANDING');
  };

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setCurrentView('CHECKOUT');
  };

  const handleCheckoutSuccess = () => {
    setCurrentView('DASHBOARD');
    setSelectedPackage(null);
  };

  // Show loading spinner during initial auth check
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Đang tải...</div>
      </div>
    );
  }

  // Render View Logic
  const renderContent = () => {
    if (currentView === 'ADMIN') {
      return <AdminDashboard onLogout={handleLogout} />;
    }

    if (currentView === 'CHECKOUT' && user && selectedPackage) {
      return (
        <Checkout
          user={user}
          pkg={selectedPackage}
          onBack={() => setCurrentView('DASHBOARD')}
          onSuccess={handleCheckoutSuccess}
        />
      );
    }

    if (currentView === 'DASHBOARD' && user) {
      return (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onSelectPackage={handleSelectPackage}
        />
      );
    }

    return <LandingPage />;
  };

  return (
    <>
      {renderContent()}

      {/* Session Invalid Modal */}
      {error && error.includes('Phiên đăng nhập hết hạn') && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center border border-slate-700 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Phiên đăng nhập hết hạn</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">{error}</p>
            <button
              onClick={() => setCurrentView('LANDING')}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      )}

      {/* Dev Tool: Login as Admin Helper */}
      {!user && (
        <div className="fixed bottom-4 right-4 opacity-50 hover:opacity-100 transition-opacity">
          <button
            onClick={loginAsAdmin}
            className="bg-slate-800 text-xs text-slate-500 px-3 py-1 rounded border border-slate-700"
          >
            Dev: Login Admin
          </button>
        </div>
      )}
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

### 4. Update LandingPage Component (20 min)

**File**: `frontend/components/LandingPage.tsx`

**Changes**:
- Replace mock login with real auth
- Add registration form (or keep Google OAuth placeholder)
- Handle loading/error states

**Key changes**:
```typescript
// Remove onStart prop
// Add login handler from useAuth hook

import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      // User state will update, triggering view change in App
    } catch (err) {
      // Error displayed in UI
    }
  };

  // ... rest of component
}
```

### 5. Remove localStorage Auth (10 min)

**Search and remove**:
- All `localStorage.getItem(STORAGE_KEYS.CURRENT_USER)`
- All `localStorage.setItem(STORAGE_KEYS.CURRENT_USER, ...)`
- All `localStorage.getItem(STORAGE_KEYS.SESSION)`
- Keep ORDERS and USERS storage for now (will remove in Phase 3)

## Security Considerations

### Token Storage
✅ **Do**:
- Store access token in memory (apiClient instance)
- Use httpOnly cookies for refresh token (backend sets)
- Clear token on logout

❌ **Don't**:
- Store tokens in localStorage (XSS vulnerable)
- Store tokens in sessionStorage
- Log tokens to console

### Session Management
- Backend enforces single session per user
- Frontend polls session validation every 30s
- Auto-logout on 401 response
- Session invalidated on server when new login occurs

## Verification Checklist

- [ ] Auth API service created
- [ ] useAuth hook created
- [ ] App component updated to use useAuth
- [ ] LandingPage login works with real API
- [ ] Login as admin works
- [ ] Logout clears token
- [ ] Session validation polling works
- [ ] 401 triggers auto-logout
- [ ] No localStorage for tokens
- [ ] TypeScript errors resolved

## Files Created

1. `frontend/services/api/auth.api.ts`
2. `frontend/hooks/useAuth.ts`

## Files Modified

1. `frontend/index.tsx`
2. `frontend/components/LandingPage.tsx`

## Testing Steps

1. **Login flow**:
   - Enter credentials
   - Click login
   - Verify token set in apiClient
   - Verify user state updated
   - Verify view changed to Dashboard/Admin

2. **Session validation**:
   - Login in tab A
   - Login same user in tab B
   - Verify tab A shows session expired modal within 30s

3. **Logout**:
   - Click logout
   - Verify token cleared
   - Verify redirected to landing

4. **Token persistence**:
   - Login
   - Refresh page
   - Verify still logged in (getMe call)

## Common Issues

**Issue**: User logged out on page refresh
- **Cause**: Access token not persisted
- **Fix**: This is expected! Use refresh token flow (future enhancement)
- **Workaround**: User must login again (acceptable for MVP)

**Issue**: Session validation causes too many requests
- **Fix**: Increase interval from 30s to 60s if needed

**Issue**: 401 not triggering logout
- **Fix**: Check error handling in apiClient intercepts 401

## Next Phase

Proceed to **Phase 3: Data Services** after verification complete.
