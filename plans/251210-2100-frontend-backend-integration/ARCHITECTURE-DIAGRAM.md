# Frontend-Backend Integration Architecture

## Current State (Before Integration)

```
┌─────────────────────────────────────────────────┐
│              Frontend (React)                    │
│              localhost:3000                      │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │         Components                          │ │
│  │  - LandingPage                              │ │
│  │  - Dashboard                                │ │
│  │  - Checkout                                 │ │
│  │  - AdminDashboard                           │ │
│  └────────────┬───────────────────────────────┘ │
│               │                                  │
│  ┌────────────▼───────────────────────────────┐ │
│  │      services/mockApi.ts                   │ │
│  │  - authService (mock)                      │ │
│  │  - dataService (mock)                      │ │
│  └────────────┬───────────────────────────────┘ │
│               │                                  │
│  ┌────────────▼───────────────────────────────┐ │
│  │      localStorage (Mock DB)                │ │
│  │  - veo3_db_users                           │ │
│  │  - veo3_db_orders                          │ │
│  │  - veo3_active_session_server_side        │ │
│  │  - veo3_local_user                         │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Target State (After Integration)

```
┌─────────────────────────────────────────────────┐
│              Frontend (React)                    │
│              localhost:3000                      │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │           Components                        │ │
│  │  - LandingPage                              │ │
│  │  - Dashboard                                │ │
│  │  - Checkout                                 │ │
│  │  - AdminDashboard                           │ │
│  │  - ErrorBoundary                            │ │
│  │  - LoadingSpinner                           │ │
│  │  - ErrorAlert                               │ │
│  └────────────┬───────────────────────────────┘ │
│               │                                  │
│  ┌────────────▼───────────────────────────────┐ │
│  │       Custom Hooks                          │ │
│  │  - useAuth()                                │ │
│  │  - usePackages()                            │ │
│  │  - useOrder()                               │ │
│  │  - useAdminOrders()                         │ │
│  │  - useAdminDashboard()                      │ │
│  └────────────┬───────────────────────────────┘ │
│               │                                  │
│  ┌────────────▼───────────────────────────────┐ │
│  │       API Services                          │ │
│  │  - authApi                                  │ │
│  │  - packagesApi                              │ │
│  │  - ordersApi                                │ │
│  │  - adminApi                                 │ │
│  └────────────┬───────────────────────────────┘ │
│               │                                  │
│  ┌────────────▼───────────────────────────────┐ │
│  │       apiClient (Base HTTP Client)         │ │
│  │  - Token injection                          │ │
│  │  - Error handling                           │ │
│  │  - Credentials: include                     │ │
│  └────────────┬───────────────────────────────┘ │
│               │                                  │
│  ┌────────────▼───────────────────────────────┐ │
│  │      Vite Dev Server Proxy                 │ │
│  │  /api → http://localhost:3001              │ │
│  └────────────┬───────────────────────────────┘ │
└───────────────┼─────────────────────────────────┘
                │ HTTP
                ▼
┌─────────────────────────────────────────────────┐
│          Backend (NestJS)                        │
│          localhost:3001                          │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │           Controllers                       │ │
│  │  - AuthController (/api/auth/*)            │ │
│  │  - PackagesController (/api/packages)      │ │
│  │  - OrdersController (/api/orders/*)        │ │
│  │  - AdminOrdersController (/api/admin/*)    │ │
│  └────────────┬───────────────────────────────┘ │
│               │                                  │
│  ┌────────────▼───────────────────────────────┐ │
│  │          Guards & Interceptors             │ │
│  │  - JWT Guard (auth required)               │ │
│  │  - Roles Guard (admin required)            │ │
│  │  - Session Validator                        │ │
│  └────────────┬───────────────────────────────┘ │
│               │                                  │
│  ┌────────────▼───────────────────────────────┐ │
│  │           Services                          │ │
│  │  - AuthService                              │ │
│  │  - PackagesService                          │ │
│  │  - OrdersService                            │ │
│  │  - AdminOrdersService                       │ │
│  └────────────┬───────────────────────────────┘ │
│               │                                  │
│  ┌────────────▼───────────────────────────────┐ │
│  │         Database Layer                      │ │
│  │  - TypeORM / Prisma                         │ │
│  │  - PostgreSQL / MySQL                       │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Authentication Flow

```
┌─────────┐                                        ┌─────────┐
│ Browser │                                        │ Backend │
└────┬────┘                                        └────┬────┘
     │                                                  │
     │  1. POST /api/auth/login                        │
     │     { email, password }                         │
     ├────────────────────────────────────────────────>│
     │                                                  │
     │                        2. Verify credentials    │
     │                           Generate JWT          │
     │                           Create session        │
     │                                                  │
     │  3. Response                                    │
     │     { user, accessToken }                       │
     │     Set-Cookie: refreshToken (httpOnly)         │
     │<────────────────────────────────────────────────┤
     │                                                  │
     │  4. Store token in memory                       │
     │     apiClient.setAccessToken(token)             │
     │                                                  │
     │  5. GET /api/auth/me                            │
     │     Authorization: Bearer {token}               │
     ├────────────────────────────────────────────────>│
     │                                                  │
     │                        6. Validate JWT          │
     │                           Check session         │
     │                                                  │
     │  7. Response { user }                           │
     │<────────────────────────────────────────────────┤
     │                                                  │
```

### 2. Order Creation Flow

```
┌─────────┐                                        ┌─────────┐
│  User   │                                        │ Backend │
└────┬────┘                                        └────┬────┘
     │                                                  │
     │  1. Select package                              │
     │  2. Navigate to Checkout                        │
     │                                                  │
     │  3. POST /api/orders                            │
     │     { packageId }                               │
     │     Authorization: Bearer {token}               │
     ├────────────────────────────────────────────────>│
     │                                                  │
     │                        4. Validate auth         │
     │                           Validate package      │
     │                           Generate transfer ID  │
     │                           Create order          │
     │                           Status: PENDING       │
     │                                                  │
     │  5. Response                                    │
     │     { order: {                                  │
     │       id, amount, transferContent,              │
     │       status: PENDING                           │
     │     }}                                          │
     │<────────────────────────────────────────────────┤
     │                                                  │
     │  6. Display VietQR code                         │
     │     with transferContent                        │
     │                                                  │
     │  7. User transfers money                        │
     │                                                  │
     │  8. POST /api/orders/:id/confirm                │
     │     Authorization: Bearer {token}               │
     ├────────────────────────────────────────────────>│
     │                                                  │
     │                        9. Update status         │
     │                           Status: PROCESSING    │
     │                           Notify admin          │
     │                                                  │
     │  10. Response { order }                         │
     │<────────────────────────────────────────────────┤
     │                                                  │
     │  11. Show success message                       │
     │                                                  │
```

### 3. Admin Order Approval Flow

```
┌─────────┐                                        ┌─────────┐
│  Admin  │                                        │ Backend │
└────┬────┘                                        └────┬────┘
     │                                                  │
     │  1. GET /api/admin/orders                       │
     │     Authorization: Bearer {admin_token}         │
     │     ?status=PROCESSING                          │
     ├────────────────────────────────────────────────>│
     │                                                  │
     │                        2. Check admin role      │
     │                           Query orders DB       │
     │                           Filter by status      │
     │                                                  │
     │  3. Response                                    │
     │     { orders: [...], total, page, limit }       │
     │<────────────────────────────────────────────────┤
     │                                                  │
     │  4. Select order                                │
     │  5. Enter license key & download link           │
     │                                                  │
     │  6. PUT /api/admin/orders/:id/approve           │
     │     { licenseKey, downloadLink }                │
     │     Authorization: Bearer {admin_token}         │
     ├────────────────────────────────────────────────>│
     │                                                  │
     │                        7. Check admin role      │
     │                           Validate order exists │
     │                           Update order          │
     │                           Status: COMPLETED     │
     │                           Send license email    │
     │                                                  │
     │  8. Response { order }                          │
     │<────────────────────────────────────────────────┤
     │                                                  │
     │  9. Show success notification                   │
     │ 10. Refresh order list                          │
     │                                                  │
```

### 4. Session Validation Flow (Every 30s)

```
┌─────────┐                                        ┌─────────┐
│ Browser │                                        │ Backend │
└────┬────┘                                        └────┬────┘
     │                                                  │
     │  Every 30 seconds:                              │
     │                                                  │
     │  1. GET /api/auth/session/status                │
     │     Authorization: Bearer {token}               │
     ├────────────────────────────────────────────────>│
     │                                                  │
     │                        2. Validate JWT          │
     │                           Check session in DB   │
     │                           Verify single session │
     │                                                  │
     │  3a. Valid session                              │
     │      Response: 200 OK                           │
     │<────────────────────────────────────────────────┤
     │                                                  │
     │  4a. Continue normal operation                  │
     │                                                  │
     │                  OR                              │
     │                                                  │
     │  3b. Invalid session (logged in elsewhere)      │
     │      Response: 401 Unauthorized                 │
     │<────────────────────────────────────────────────┤
     │                                                  │
     │  4b. Auto-logout                                │
     │      Clear token                                │
     │      Show session expired modal                 │
     │      Redirect to landing page                   │
     │                                                  │
```

## File Structure After Integration

```
frontend/
├── components/
│   ├── Dashboard.tsx ──────────┐
│   ├── Checkout.tsx ──────────┐│
│   ├── AdminDashboard.tsx ───┐││
│   ├── LandingPage.tsx ──────┘││
│   ├── ErrorBoundary.tsx      ││
│   ├── LoadingSpinner.tsx     ││
│   ├── ErrorAlert.tsx         ││
│   └── SessionExpiredModal.tsx││
│                               ││
├── hooks/                      ││
│   ├── useAuth.ts <───────────┘│
│   ├── usePackages.ts          │
│   ├── useOrder.ts <───────────┘
│   ├── useAdminOrders.ts
│   └── useAdminDashboard.ts
│           │
│           ▼
├── services/api/
│   ├── auth.api.ts
│   ├── packages.api.ts
│   ├── orders.api.ts
│   └── admin.api.ts
│           │
│           ▼
├── services/
│   └── apiClient.ts ◄─────────── Base HTTP client
│           │
│           ▼
├── utils/
│   ├── errorHandler.ts
│   └── globalErrorHandler.ts
│
├── types/
│   ├── types.ts
│   └── api.types.ts
│
├── vite.config.ts ◄─────────────── Proxy config
└── index.tsx ◄──────────────────── App entry
```

## Token Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Token Lifecycle                        │
└──────────────────────────────────────────────────────────┘

1. Login
   └─> Backend generates JWT
       └─> accessToken (15 min expiry)
       └─> refreshToken (7 days expiry, httpOnly cookie)

2. Store
   └─> accessToken → apiClient memory (NOT localStorage)
   └─> refreshToken → httpOnly cookie (automatic)

3. Usage
   └─> Every API call:
       └─> apiClient adds: Authorization: Bearer {accessToken}
       └─> Browser sends refreshToken cookie automatically

4. Validation
   └─> Every 30s: GET /api/auth/session/status
       └─> If 401: Auto-logout + clear token

5. Expiry
   └─> Access token expires → User must re-login (MVP)
   └─> Future: Auto-refresh using refreshToken

6. Logout
   └─> POST /api/auth/logout
       └─> Clear accessToken from memory
       └─> Backend invalidates session
       └─> Clear refreshToken cookie
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Security Layers                        │
└─────────────────────────────────────────────────────────┘

Layer 1: Network
├─> HTTPS only (production)
├─> Vite proxy (development)
└─> CORS configured

Layer 2: Authentication
├─> JWT token validation
├─> Session in database/Redis
├─> Single session enforcement
└─> Auto-logout on invalid session

Layer 3: Authorization
├─> Role-based access control
├─> Admin endpoints require ADMIN role
└─> Users can only access their own data

Layer 4: Data Protection
├─> No localStorage for sensitive data
├─> HttpOnly cookies for refresh token
├─> Access token in memory only
├─> Password hashing (backend)
└─> Input validation (both sides)

Layer 5: Error Handling
├─> No sensitive info in error messages
├─> Generic errors to users
├─> Detailed logs server-side only
└─> Error boundary for crashes
```

## Integration Checklist

```
Phase 1: API Client Setup
├─> [✓] Vite proxy configured
├─> [✓] apiClient.ts created
├─> [✓] Error handling utilities
├─> [✓] API types defined
└─> [✓] Proxy tested

Phase 2: Auth Integration
├─> [✓] authApi.ts created
├─> [✓] useAuth hook created
├─> [✓] Login flow working
├─> [✓] Session validation working
└─> [✓] Auto-logout on 401

Phase 3: Data Services
├─> [✓] packagesApi.ts created
├─> [✓] ordersApi.ts created
├─> [✓] usePackages hook created
├─> [✓] useOrder hook created
└─> [✓] Checkout flow working

Phase 4: Admin Integration
├─> [✓] adminApi.ts created
├─> [✓] useAdminOrders hook created
├─> [✓] useAdminDashboard hook created
├─> [✓] Order approval working
└─> [✓] Dashboard stats working

Phase 5: Polish
├─> [✓] ErrorBoundary added
├─> [✓] Loading states added
├─> [✓] Error alerts added
├─> [✓] Session modal enhanced
└─> [✓] All components polished
```

---

**Visual reference for implementation**
**Follow plan.md for detailed instructions**
