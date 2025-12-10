# Phase 3: Data Services Integration

**Duration**: 2-3 hours
**Dependencies**: Phase 2 complete
**Risk**: Low

## Objectives

- Replace dataService with real API calls
- Integrate packages endpoint
- Integrate orders CRUD
- Payment confirmation flow
- Remove localStorage for orders/packages

## Backend Endpoints

```
# Packages (Public)
GET    /api/packages           - List all packages
GET    /api/packages/:id       - Get single package

# Orders (Auth required)
POST   /api/orders             - Create new order
GET    /api/orders/:id         - Get single order
POST   /api/orders/:id/confirm - Confirm payment
GET    /api/orders/:id/status  - Get order status
```

## Tasks

### 1. Create Packages API Service (20 min)

**File**: `frontend/services/api/packages.api.ts` (new)

**Content**:
```typescript
import { apiClient } from '../apiClient';
import { Package } from '../../types';

export const packagesApi = {
  /**
   * Get all available packages
   * Public endpoint - no auth required
   */
  getAll: async (): Promise<Package[]> => {
    return apiClient.get<Package[]>('/packages');
  },

  /**
   * Get single package by ID
   */
  getOne: async (id: string): Promise<Package> => {
    return apiClient.get<Package>(`/packages/${id}`);
  },
};
```

### 2. Create Orders API Service (45 min)

**File**: `frontend/services/api/orders.api.ts` (new)

**Content**:
```typescript
import { apiClient } from '../apiClient';
import { Order } from '../../types';
import { CreateOrderDto } from '../../types/api.types';

export const ordersApi = {
  /**
   * Create new order
   * Backend generates transfer content, order ID, etc.
   */
  create: async (dto: CreateOrderDto): Promise<Order> => {
    return apiClient.post<Order>('/orders', dto);
  },

  /**
   * Get single order by ID
   * User can only access their own orders
   */
  getOne: async (orderId: string): Promise<Order> => {
    return apiClient.get<Order>(`/orders/${orderId}`);
  },

  /**
   * Confirm payment for order
   * Updates order status to PROCESSING
   * Sends notification to admin
   */
  confirmPayment: async (orderId: string): Promise<Order> => {
    return apiClient.post<Order>(`/orders/${orderId}/confirm`);
  },

  /**
   * Get order status
   * For polling order updates
   */
  getStatus: async (orderId: string): Promise<{ status: string }> => {
    return apiClient.get<{ status: string }>(`/orders/${orderId}/status`);
  },
};
```

### 3. Create usePackages Hook (25 min)

**File**: `frontend/hooks/usePackages.ts` (new)

**Content**:
```typescript
import { useState, useEffect } from 'react';
import { packagesApi } from '../services/api/packages.api';
import { Package } from '../types';
import { ApiException } from '../utils/errorHandler';

interface UsePackagesReturn {
  packages: Package[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePackages = (): UsePackagesReturn => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await packagesApi.getAll();
      setPackages(data);
    } catch (err) {
      const message = err instanceof ApiException
        ? err.message
        : 'Không thể tải danh sách gói dịch vụ';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    packages,
    loading,
    error,
    refetch: fetchPackages,
  };
};
```

### 4. Create useOrder Hook (35 min)

**File**: `frontend/hooks/useOrder.ts` (new)

**Content**:
```typescript
import { useState, useCallback } from 'react';
import { ordersApi } from '../services/api/orders.api';
import { Order } from '../types';
import { CreateOrderDto } from '../types/api.types';
import { ApiException } from '../utils/errorHandler';

interface UseOrderReturn {
  order: Order | null;
  loading: boolean;
  error: string | null;
  createOrder: (dto: CreateOrderDto) => Promise<Order>;
  confirmPayment: (orderId: string) => Promise<Order>;
  getOrderStatus: (orderId: string) => Promise<string>;
  clearOrder: () => void;
}

export const useOrder = (): UseOrderReturn => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = useCallback(async (dto: CreateOrderDto): Promise<Order> => {
    try {
      setLoading(true);
      setError(null);
      const newOrder = await ordersApi.create(dto);
      setOrder(newOrder);
      return newOrder;
    } catch (err) {
      const message = err instanceof ApiException
        ? err.message
        : 'Không thể tạo đơn hàng';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmPayment = useCallback(async (orderId: string): Promise<Order> => {
    try {
      setLoading(true);
      setError(null);
      const updatedOrder = await ordersApi.confirmPayment(orderId);
      setOrder(updatedOrder);
      return updatedOrder;
    } catch (err) {
      const message = err instanceof ApiException
        ? err.message
        : 'Không thể xác nhận thanh toán';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrderStatus = useCallback(async (orderId: string): Promise<string> => {
    try {
      const { status } = await ordersApi.getStatus(orderId);
      return status;
    } catch (err) {
      throw err;
    }
  }, []);

  const clearOrder = useCallback(() => {
    setOrder(null);
    setError(null);
  }, []);

  return {
    order,
    loading,
    error,
    createOrder,
    confirmPayment,
    getOrderStatus,
    clearOrder,
  };
};
```

### 5. Update Dashboard Component (30 min)

**File**: `frontend/components/Dashboard.tsx`

**Changes**:
```typescript
import { usePackages } from '../hooks/usePackages';

const Dashboard = ({ user, onLogout, onSelectPackage }) => {
  const { packages, loading, error } = usePackages();

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white">Đang tải gói dịch vụ...</div>
    </div>;
  }

  if (error) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-red-500">{error}</div>
    </div>;
  }

  // ... rest of component
  // Replace PACKAGES constant with packages from hook
}
```

### 6. Update Checkout Component (45 min)

**File**: `frontend/components/Checkout.tsx`

**Key changes**:
```typescript
import { useOrder } from '../hooks/useOrder';

const Checkout = ({ user, pkg, onBack, onSuccess }) => {
  const { order, loading, error, createOrder, confirmPayment } = useOrder();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Create order on mount
  useEffect(() => {
    const initOrder = async () => {
      try {
        await createOrder({ packageId: pkg.id });
        setCurrentStep(2); // Move to QR code step
      } catch (err) {
        // Show error
      }
    };
    initOrder();
  }, []);

  // Step 2: User confirms payment
  const handleConfirmPayment = async () => {
    if (!order) return;

    try {
      await confirmPayment(order.id);
      setCurrentStep(3); // Success step
    } catch (err) {
      // Show error
    }
  };

  // Render steps based on currentStep
  // Use order.transferContent for QR code
  // Use order.id for display
}
```

**VietQR URL update**:
```typescript
// Old (mock)
const qrUrl = `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${amount}&addInfo=${content}`;

// New (from backend order)
const qrUrl = `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${order.amount}&addInfo=${encodeURIComponent(order.transferContent)}`;
```

### 7. Remove localStorage Data (15 min)

**Remove from mockApi.ts**:
- `STORAGE_KEYS.ORDERS` - orders now from backend
- Keep only for backward compatibility if needed

**Search and replace**:
```typescript
// Remove all:
localStorage.getItem(STORAGE_KEYS.ORDERS)
localStorage.setItem(STORAGE_KEYS.ORDERS, ...)
getOrders()
saveOrders()
```

**Backup mockApi.ts**:
```bash
mv frontend/services/mockApi.ts frontend/services/mockApi.backup.ts
```

## Data Flow Comparison

### Before (Mock)
```
Component → mockApi.ts → localStorage → Component
```

### After (Real API)
```
Component → Hook (usePackages/useOrder) → API Service → Backend → Database
                ↓
          State Update → Component Re-render
```

## Verification Checklist

- [ ] Packages API service created
- [ ] Orders API service created
- [ ] usePackages hook created
- [ ] useOrder hook created
- [ ] Dashboard shows real packages
- [ ] Checkout creates real order
- [ ] QR code uses real transfer content
- [ ] Payment confirmation works
- [ ] Loading states display
- [ ] Error handling works
- [ ] No localStorage for orders

## Files Created

1. `frontend/services/api/packages.api.ts`
2. `frontend/services/api/orders.api.ts`
3. `frontend/hooks/usePackages.ts`
4. `frontend/hooks/useOrder.ts`

## Files Modified

1. `frontend/components/Dashboard.tsx`
2. `frontend/components/Checkout.tsx`

## Files Renamed

1. `frontend/services/mockApi.ts` → `mockApi.backup.ts`

## Testing Steps

1. **Packages loading**:
   - Open Dashboard
   - Verify packages load from backend
   - Check network tab: `GET /api/packages`

2. **Order creation**:
   - Select package
   - Go to Checkout
   - Verify order created
   - Check network tab: `POST /api/orders`

3. **Payment confirmation**:
   - Click "Đã chuyển khoản"
   - Verify order status updates to PROCESSING
   - Check network tab: `POST /api/orders/:id/confirm`

4. **Error handling**:
   - Stop backend server
   - Try to load packages
   - Verify error message displays

## Common Issues

**Issue**: Order not created on checkout
- **Check**: Network tab for error response
- **Check**: Backend logs for validation errors
- **Fix**: Ensure packageId is valid

**Issue**: QR code not displaying
- **Check**: order.transferContent exists
- **Check**: VietQR API URL format correct

**Issue**: Payment confirmation fails
- **Check**: Order ID is correct
- **Check**: User is authenticated (token valid)

## Backend Requirements

Ensure backend has:
- [ ] Packages seeded in database
- [ ] Order creation endpoint working
- [ ] Transfer content generation logic
- [ ] Payment confirmation endpoint
- [ ] Proper auth guards on protected endpoints

## Next Phase

Proceed to **Phase 4: Admin Integration** after verification complete.
