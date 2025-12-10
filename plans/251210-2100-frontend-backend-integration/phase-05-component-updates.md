# Phase 5: Component Updates & Polish

**Duration**: 2-3 hours
**Dependencies**: Phase 4 complete
**Risk**: Low

## Objectives

- Polish all components for production
- Add comprehensive error handling
- Improve loading states
- Session expiry UX
- Remove all mock dependencies
- Final testing & cleanup

## Tasks

### 1. Enhanced Error Handling (40 min)

**File**: `frontend/components/ErrorBoundary.tsx` (new)

**Content**:
```typescript
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center border border-slate-700">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Đã xảy ra lỗi
            </h3>
            <p className="text-slate-400 mb-6">
              Ứng dụng gặp sự cố không mong muốn. Vui lòng tải lại trang.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Wrap App in ErrorBoundary**:
```typescript
// frontend/index.tsx
import { ErrorBoundary } from './components/ErrorBoundary';

const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

### 2. Loading Spinner Component (20 min)

**File**: `frontend/components/LoadingSpinner.tsx` (new)

**Content**:
```typescript
import React from 'react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullScreen = false,
  text = 'Đang tải...',
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      <p className="text-slate-400">{text}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
```

**Usage in components**:
```typescript
if (loading) {
  return <LoadingSpinner fullScreen text="Đang tải gói dịch vụ..." />;
}
```

### 3. Error Alert Component (25 min)

**File**: `frontend/components/ErrorAlert.tsx` (new)

**Content**:
```typescript
import React from 'react';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onRetry,
  onDismiss,
}) => {
  return (
    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-red-400 text-sm">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs text-red-300 hover:text-red-100 underline"
            >
              Thử lại
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-300"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
```

**Usage**:
```typescript
{error && (
  <ErrorAlert
    message={error}
    onRetry={refetch}
    onDismiss={() => setError(null)}
  />
)}
```

### 4. Update Dashboard Component (30 min)

**File**: `frontend/components/Dashboard.tsx`

**Add error/loading UI**:
```typescript
const Dashboard = ({ user, onLogout, onSelectPackage }) => {
  const { packages, loading, error, refetch } = usePackages();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        {/* ... existing header */}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* User Profile Card */}
        {/* ... existing card */}

        {/* Error Alert */}
        {error && (
          <ErrorAlert
            message={error}
            onRetry={refetch}
          />
        )}

        {/* Loading State */}
        {loading && (
          <LoadingSpinner text="Đang tải gói dịch vụ..." />
        )}

        {/* Packages Grid */}
        {!loading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              // ... package card
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && packages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">Chưa có gói dịch vụ nào</p>
          </div>
        )}
      </main>
    </div>
  );
};
```

### 5. Update Checkout Component (35 min)

**File**: `frontend/components/Checkout.tsx`

**Improve error handling and loading**:
```typescript
const Checkout = ({ user, pkg, onBack, onSuccess }) => {
  const { order, loading, error, createOrder, confirmPayment, clearOrder } = useOrder();
  const [currentStep, setCurrentStep] = useState(1);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const initOrder = async () => {
      try {
        setLocalError(null);
        await createOrder({ packageId: pkg.id });
        setCurrentStep(2);
      } catch (err) {
        setLocalError('Không thể tạo đơn hàng. Vui lòng thử lại.');
      }
    };
    initOrder();

    return () => {
      clearOrder(); // Cleanup on unmount
    };
  }, []);

  const handleConfirmPayment = async () => {
    if (!order) return;

    try {
      setLocalError(null);
      await confirmPayment(order.id);
      setCurrentStep(3);
    } catch (err) {
      setLocalError('Không thể xác nhận thanh toán. Vui lòng thử lại.');
    }
  };

  // Show error state
  if (error || localError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <ErrorAlert
            message={error || localError || ''}
            onRetry={() => window.location.reload()}
          />
          <button
            onClick={onBack}
            className="mt-4 text-slate-400 hover:text-white"
          >
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Show loading during order creation
  if (loading && !order) {
    return <LoadingSpinner fullScreen text="Đang tạo đơn hàng..." />;
  }

  // Rest of component...
};
```

### 6. Update AdminDashboard Component (35 min)

**File**: `frontend/components/AdminDashboard.tsx`

**Add comprehensive error/loading states**:
```typescript
const AdminDashboard = ({ onLogout }) => {
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    refetch,
    // ... other props
  } = useAdminOrders();

  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useAdminDashboard();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      {/* ... */}

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats Cards */}
        {statsLoading && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card p-6 rounded-2xl animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-slate-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {statsError && (
          <ErrorAlert message={statsError} />
        )}

        {!statsLoading && stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {/* Stats cards */}
          </div>
        )}

        {/* Orders Table */}
        {ordersError && (
          <ErrorAlert
            message={ordersError}
            onRetry={refetch}
          />
        )}

        {ordersLoading && (
          <LoadingSpinner text="Đang tải đơn hàng..." />
        )}

        {!ordersLoading && !ordersError && (
          <div className="glass-card p-6 rounded-2xl">
            {/* Table */}
          </div>
        )}
      </main>
    </div>
  );
};
```

### 7. Session Expiry Modal Enhancement (20 min)

**File**: `frontend/components/SessionExpiredModal.tsx` (new)

**Content**:
```typescript
import React from 'react';

interface SessionExpiredModalProps {
  message: string;
  onClose: () => void;
}

export const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  message,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full text-center border border-slate-700 shadow-2xl">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Phiên đăng nhập hết hạn
        </h3>
        <p className="text-slate-400 mb-8 leading-relaxed">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
};
```

**Usage in index.tsx**:
```typescript
import { SessionExpiredModal } from './components/SessionExpiredModal';

{error && error.includes('Phiên đăng nhập hết hạn') && (
  <SessionExpiredModal
    message={error}
    onClose={() => {
      setError(null);
      setCurrentView('LANDING');
    }}
  />
)}
```

### 8. Final Cleanup (25 min)

**Remove mock dependencies**:
```bash
# Remove backup file if no longer needed
rm frontend/services/mockApi.backup.ts

# Or keep as reference, rename to .txt
mv frontend/services/mockApi.backup.ts frontend/services/mockApi.reference.txt
```

**Clean up unused imports**:
```bash
# Search for any remaining mockApi imports
grep -r "mockApi" frontend/components/
grep -r "mockApi" frontend/index.tsx

# Remove them
```

**Update package.json scripts** (if needed):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

### 9. Add Global Error Handler (15 min)

**File**: `frontend/utils/globalErrorHandler.ts` (new)

**Content**:
```typescript
import { ApiException, isUnauthorized } from './errorHandler';

/**
 * Global error handler for unhandled promise rejections
 * Logs errors and shows user-friendly messages
 */
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);

    // Don't show alert for 401 (handled by auth system)
    if (isUnauthorized(event.reason)) {
      return;
    }

    // Show error to user
    if (event.reason instanceof ApiException) {
      console.error('API Error:', event.reason.message);
    } else {
      console.error('Unknown error:', event.reason);
    }
  });

  // Handle runtime errors
  window.addEventListener('error', (event) => {
    console.error('Runtime error:', event.error);
  });
};
```

**Initialize in index.tsx**:
```typescript
import { setupGlobalErrorHandler } from './utils/globalErrorHandler';

// Setup global error handler
setupGlobalErrorHandler();

const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
```

### 10. Add TypeScript Strict Checks (10 min)

**File**: `frontend/tsconfig.json`

**Enable strict mode** (if not already):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    // ... rest
  }
}
```

**Fix any TypeScript errors** that appear after enabling strict mode.

## Verification Checklist

- [ ] ErrorBoundary component created
- [ ] LoadingSpinner component created
- [ ] ErrorAlert component created
- [ ] SessionExpiredModal component created
- [ ] All components use new error/loading components
- [ ] Dashboard has proper error handling
- [ ] Checkout has proper error handling
- [ ] AdminDashboard has proper error handling
- [ ] Global error handler setup
- [ ] Mock dependencies removed/renamed
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Session expiry modal works
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Retry functionality works

## Files Created

1. `frontend/components/ErrorBoundary.tsx`
2. `frontend/components/LoadingSpinner.tsx`
3. `frontend/components/ErrorAlert.tsx`
4. `frontend/components/SessionExpiredModal.tsx`
5. `frontend/utils/globalErrorHandler.ts`

## Files Modified

1. `frontend/index.tsx`
2. `frontend/components/Dashboard.tsx`
3. `frontend/components/Checkout.tsx`
4. `frontend/components/AdminDashboard.tsx`
5. `frontend/tsconfig.json`

## Files Deleted/Renamed

1. `frontend/services/mockApi.backup.ts` → deleted or renamed to `.reference.txt`

## Final Testing Checklist

### Auth Flow
- [ ] Login works
- [ ] Logout works
- [ ] Session validation works
- [ ] Session expiry modal displays
- [ ] Page refresh maintains session (until token expires)

### User Flow
- [ ] Packages load
- [ ] Order creation works
- [ ] Payment confirmation works
- [ ] QR code displays
- [ ] Success screen shows

### Admin Flow
- [ ] Order listing works
- [ ] Filters work
- [ ] Pagination works
- [ ] Order approval works
- [ ] Order rejection works
- [ ] Stats display correctly
- [ ] Auto-refresh works

### Error Handling
- [ ] Network errors show friendly message
- [ ] Validation errors display
- [ ] 401 triggers auto-logout
- [ ] 500 errors show generic message
- [ ] Retry button works
- [ ] Error boundary catches crashes

### Loading States
- [ ] Initial load shows spinner
- [ ] API calls show loading
- [ ] Skeleton loaders for stats
- [ ] No flash of empty content

### Polish
- [ ] No console errors
- [ ] No console warnings
- [ ] Smooth transitions
- [ ] Responsive on mobile
- [ ] Keyboard navigation works

## Performance Checks

- [ ] Bundle size < 500KB (check with `npm run build`)
- [ ] Lighthouse score > 90
- [ ] No unnecessary re-renders
- [ ] Images lazy load
- [ ] API calls not duplicated

## Browser Testing

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

## Production Readiness

- [ ] Environment variables configured
- [ ] Build succeeds without errors
- [ ] Preview build works correctly
- [ ] HTTPS enforced (production)
- [ ] CSP headers configured (backend)

## Rollback Plan

If critical issues found:
1. Git revert to last stable commit
2. Restore mockApi.backup.ts
3. Update imports to use mock
4. Deploy previous version

## Documentation Updates

Update README.md:
- Remove mock API references
- Add backend setup instructions
- Document environment variables
- Add troubleshooting section

## Success Criteria

All verification checkboxes complete ✅

Frontend fully integrated with backend, no mock dependencies remaining, production-ready error handling and UX polish applied.

## Next Steps

1. Deploy to staging environment
2. User acceptance testing
3. Performance testing
4. Security audit
5. Production deployment
