# Phase 4: Admin Integration

**Duration**: 1-2 hours
**Dependencies**: Phase 3 complete
**Risk**: Low

## Objectives

- Replace admin mock API with real endpoints
- Integrate order listing with filters/pagination
- Order approval/rejection flow
- Dashboard statistics
- Real-time order polling

## Backend Endpoints

```
# Admin Orders (ADMIN role required)
GET    /api/admin/orders              - List all orders (filterable, paginated)
GET    /api/admin/orders/:id          - Get single order details
PUT    /api/admin/orders/:id/approve  - Approve order with license
PUT    /api/admin/orders/:id/reject   - Reject order with reason

# Admin Dashboard
GET    /api/admin/dashboard           - Get dashboard statistics
```

## Tasks

### 1. Create Admin API Service (35 min)

**File**: `frontend/services/api/admin.api.ts` (new)

**Content**:
```typescript
import { apiClient } from '../apiClient';
import { Order } from '../../types';
import {
  ApproveOrderDto,
  RejectOrderDto,
  DashboardStats,
} from '../../types/api.types';

interface OrdersQueryParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export const adminApi = {
  /**
   * Get all orders with filters
   * Supports: status filter, search, pagination
   */
  getOrders: async (params?: OrdersQueryParams): Promise<OrdersResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/admin/orders?${query}` : '/admin/orders';

    return apiClient.get<OrdersResponse>(endpoint);
  },

  /**
   * Get single order details
   */
  getOrder: async (orderId: string): Promise<Order> => {
    return apiClient.get<Order>(`/admin/orders/${orderId}`);
  },

  /**
   * Approve order
   * Provide license key and download link
   */
  approveOrder: async (
    orderId: string,
    dto: ApproveOrderDto
  ): Promise<Order> => {
    return apiClient.put<Order>(`/admin/orders/${orderId}/approve`, dto);
  },

  /**
   * Reject order
   * Provide rejection reason
   */
  rejectOrder: async (
    orderId: string,
    dto: RejectOrderDto
  ): Promise<Order> => {
    return apiClient.put<Order>(`/admin/orders/${orderId}/reject`, dto);
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    return apiClient.get<DashboardStats>('/admin/dashboard');
  },
};
```

### 2. Create useAdminOrders Hook (40 min)

**File**: `frontend/hooks/useAdminOrders.ts` (new)

**Content**:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api/admin.api';
import { Order } from '../types';
import { ApproveOrderDto, RejectOrderDto } from '../types/api.types';
import { ApiException } from '../utils/errorHandler';

interface UseAdminOrdersReturn {
  orders: Order[];
  total: number;
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  statusFilter: string;
  searchQuery: string;
  setPage: (page: number) => void;
  setStatusFilter: (status: string) => void;
  setSearchQuery: (query: string) => void;
  refetch: () => Promise<void>;
  approveOrder: (orderId: string, dto: ApproveOrderDto) => Promise<void>;
  rejectOrder: (orderId: string, dto: RejectOrderDto) => Promise<void>;
}

export const useAdminOrders = (): UseAdminOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getOrders({
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit,
      });
      setOrders(response.orders);
      setTotal(response.total);
    } catch (err) {
      const message = err instanceof ApiException
        ? err.message
        : 'Không thể tải danh sách đơn hàng';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, searchQuery]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const approveOrder = useCallback(
    async (orderId: string, dto: ApproveOrderDto) => {
      try {
        await adminApi.approveOrder(orderId, dto);
        // Refetch orders to update list
        await fetchOrders();
      } catch (err) {
        const message = err instanceof ApiException
          ? err.message
          : 'Không thể duyệt đơn hàng';
        throw new Error(message);
      }
    },
    [fetchOrders]
  );

  const rejectOrder = useCallback(
    async (orderId: string, dto: RejectOrderDto) => {
      try {
        await adminApi.rejectOrder(orderId, dto);
        await fetchOrders();
      } catch (err) {
        const message = err instanceof ApiException
          ? err.message
          : 'Không thể từ chối đơn hàng';
        throw new Error(message);
      }
    },
    [fetchOrders]
  );

  return {
    orders,
    total,
    loading,
    error,
    page,
    limit,
    statusFilter,
    searchQuery,
    setPage,
    setStatusFilter,
    setSearchQuery,
    refetch: fetchOrders,
    approveOrder,
    rejectOrder,
  };
};
```

### 3. Create useAdminDashboard Hook (20 min)

**File**: `frontend/hooks/useAdminDashboard.ts` (new)

**Content**:
```typescript
import { useState, useEffect } from 'react';
import { adminApi } from '../services/api/admin.api';
import { DashboardStats } from '../types/api.types';
import { ApiException } from '../utils/errorHandler';

interface UseAdminDashboardReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAdminDashboard = (): UseAdminDashboardReturn => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      const message = err instanceof ApiException
        ? err.message
        : 'Không thể tải thống kê';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};
```

### 4. Update AdminDashboard Component (35 min)

**File**: `frontend/components/AdminDashboard.tsx`

**Key changes**:
```typescript
import { useAdminOrders } from '../hooks/useAdminOrders';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

const AdminDashboard = ({ onLogout }) => {
  const {
    orders,
    total,
    loading: ordersLoading,
    error: ordersError,
    page,
    statusFilter,
    searchQuery,
    setPage,
    setStatusFilter,
    setSearchQuery,
    approveOrder,
    rejectOrder,
  } = useAdminOrders();

  const {
    stats,
    loading: statsLoading,
    error: statsError,
  } = useAdminDashboard();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [licenseKey, setLicenseKey] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  // Handle approve order
  const handleApprove = async () => {
    if (!selectedOrder) return;

    try {
      setProcessingOrderId(selectedOrder.id);
      await approveOrder(selectedOrder.id, {
        licenseKey,
        downloadLink,
      });
      // Success - close modal
      setSelectedOrder(null);
      setLicenseKey('');
      setDownloadLink('');
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Handle reject order
  const handleReject = async () => {
    if (!selectedOrder) return;

    const reason = prompt('Lý do từ chối:');
    if (!reason) return;

    try {
      setProcessingOrderId(selectedOrder.id);
      await rejectOrder(selectedOrder.id, { reason });
      setSelectedOrder(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Render statistics cards from stats
  // Render orders table from orders array
  // Use statusFilter, searchQuery for filters
  // Use setPage for pagination
};
```

**Replace hardcoded stats**:
```typescript
// Old
const stats = {
  totalOrders: orders.length,
  pendingOrders: orders.filter(o => o.status === 'PROCESSING').length,
  // ...
};

// New
const stats = {
  totalOrders: stats?.totalOrders || 0,
  pendingOrders: stats?.pendingOrders || 0,
  totalRevenue: stats?.totalRevenue || 0,
  newUsers: stats?.newUsers || 0,
};
```

**Update table to use paginated orders**:
```typescript
// Old
const filteredOrders = orders.filter(...);

// New - backend handles filtering
// Just display orders from hook
{orders.map(order => (
  // ... table row
))}

// Pagination controls
<div className="pagination">
  {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
    <button
      key={i}
      onClick={() => setPage(i + 1)}
      className={page === i + 1 ? 'active' : ''}
    >
      {i + 1}
    </button>
  ))}
</div>
```

### 5. Remove Admin Mock Data (10 min)

**Remove from mockApi.backup.ts**:
- `getAllOrders` function
- `processOrder` function

**Verify no imports remain**:
```bash
# Search for remaining mockApi imports in AdminDashboard
grep -n "mockApi" frontend/components/AdminDashboard.tsx
# Should return nothing
```

## Verification Checklist

- [ ] Admin API service created
- [ ] useAdminOrders hook created
- [ ] useAdminDashboard hook created
- [ ] AdminDashboard uses real API
- [ ] Order listing loads from backend
- [ ] Status filter works
- [ ] Search works
- [ ] Pagination works
- [ ] Order approval works
- [ ] Order rejection works
- [ ] Dashboard stats load
- [ ] Auto-refresh works (10s for orders, 30s for stats)
- [ ] Loading states display
- [ ] Error handling works

## Files Created

1. `frontend/services/api/admin.api.ts`
2. `frontend/hooks/useAdminOrders.ts`
3. `frontend/hooks/useAdminDashboard.ts`

## Files Modified

1. `frontend/components/AdminDashboard.tsx`

## Testing Steps

1. **Order listing**:
   - Login as admin
   - Verify orders load from backend
   - Check network tab: `GET /api/admin/orders`

2. **Filtering**:
   - Select status filter (e.g., PROCESSING)
   - Verify filtered orders display
   - Check network tab: `GET /api/admin/orders?status=PROCESSING`

3. **Search**:
   - Enter search query
   - Verify search results
   - Check network tab: `GET /api/admin/orders?search=...`

4. **Pagination**:
   - Click page 2
   - Verify different orders load
   - Check network tab: `GET /api/admin/orders?page=2`

5. **Approve order**:
   - Click order to open modal
   - Enter license key and download link
   - Click approve
   - Verify order status updates to COMPLETED
   - Check network tab: `PUT /api/admin/orders/:id/approve`

6. **Reject order**:
   - Click reject button
   - Enter reason
   - Verify order status updates to REJECTED
   - Check network tab: `PUT /api/admin/orders/:id/reject`

7. **Dashboard stats**:
   - Verify stats display
   - Check network tab: `GET /api/admin/dashboard`

8. **Auto-refresh**:
   - Wait 10 seconds
   - Verify orders list refreshes
   - Check network tab for automatic requests

## Common Issues

**Issue**: 403 Forbidden on admin endpoints
- **Cause**: User not admin role
- **Fix**: Ensure logged in as admin user
- **Check**: Backend role guard configured

**Issue**: Pagination not working
- **Cause**: Total count incorrect
- **Fix**: Verify backend returns total in response

**Issue**: Auto-refresh too frequent
- **Cause**: Multiple intervals running
- **Fix**: Check useEffect cleanup functions

**Issue**: Order modal not closing after approval
- **Cause**: State not cleared
- **Fix**: Add setSelectedOrder(null) after success

## Performance Considerations

**Auto-refresh optimization**:
- Orders: 10s interval (can increase if too frequent)
- Stats: 30s interval
- Pause refresh when modal open (future)
- Use debounce for search input (future)

**Pagination**:
- Default limit: 10 orders per page
- Can increase to 20/50 if needed
- Backend handles all filtering/sorting

## Backend Requirements

Ensure backend has:
- [ ] Admin role guard on all `/admin/*` endpoints
- [ ] Pagination working correctly
- [ ] Status filter implemented
- [ ] Search functionality working
- [ ] Dashboard stats calculation correct
- [ ] Order approval updates status + sends email/notification
- [ ] Order rejection updates status

## Next Phase

Proceed to **Phase 5: Component Updates** after verification complete.
