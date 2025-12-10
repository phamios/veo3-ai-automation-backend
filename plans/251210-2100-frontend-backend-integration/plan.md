# Frontend-Backend Integration Plan

**Date**: 2025-12-10
**Plan ID**: 251210-2100
**Effort**: ~8-12 hours
**Risk**: Medium

## Overview

Replace localStorage-based mockApi.ts with real HTTP API client connecting to NestJS backend. Frontend runs on localhost:3000, backend on localhost:3001.

## Current State Analysis

**Frontend (React + Vite)**:
- Mock API using localStorage (services/mockApi.ts)
- Session management client-side only
- No HTTP client configured
- No JWT token handling
- No error handling for API failures
- Vite proxy not configured

**Backend (NestJS)**:
- Auth endpoints: `/api/auth/*` (register, login, logout, me)
- Packages endpoint: `/api/packages`
- Orders endpoints: `/api/orders/*`
- Admin endpoints: `/api/admin/orders/*`, `/api/admin/dashboard/*`
- JWT authentication with session validation
- Returns 401 on invalid session (single session enforcement)

## Integration Strategy

### Phase Breakdown

**Phase 1: API Client Setup** (~2 hours)
- Configure Vite proxy to `/api` → `http://localhost:3001`
- Create base HTTP client service with fetch API
- Add request/response interceptors for JWT
- Error handling utilities

**Phase 2: Auth Integration** (~2-3 hours)
- Replace authService with real API calls
- JWT token storage in memory + httpOnly cookies
- Session validation endpoint integration
- Handle 401 responses (session invalidation)

**Phase 3: Data Services** (~2-3 hours)
- Replace dataService with real API calls
- Packages endpoint integration
- Orders CRUD operations
- Payment confirmation flow

**Phase 4: Admin Integration** (~1-2 hours)
- Admin order listing with filters
- Order approval/rejection
- Dashboard stats endpoint
- Real-time polling updates

**Phase 5: Component Updates** (~2-3 hours)
- Update all components to use new API
- Add loading states
- Error handling UI
- Session expiry handling

## Execution Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
   ↓         ↓         ↓         ↓         ↓
  Setup    Auth     Orders   Admin     Polish
```

**Sequential execution required** - each phase depends on previous

## Technical Decisions

### Token Storage
- **Access Token**: Memory only (React state)
- **Refresh Token**: HttpOnly cookie (set by backend)
- **Never**: localStorage (XSS vulnerable)

### Error Handling
- Network errors: Toast notification + retry option
- 401 Unauthorized: Auto-logout + redirect to landing
- 403 Forbidden: Show permission error
- 400/422 Validation: Display field errors
- 500 Server: Generic error message

### API Client Pattern
- Single `apiClient.ts` with base fetch wrapper
- Separate service files per domain (auth, orders, packages, admin)
- TypeScript interfaces matching backend DTOs
- Automatic token injection via interceptor

## Dependencies

**None required** - using native fetch API

**Optional enhancements**:
- `@tanstack/react-query` for caching (future)
- `zod` for runtime validation (future)

## Success Criteria

- [x] All mockApi calls replaced with real API
- [x] JWT authentication working end-to-end
- [x] Single session enforcement functional
- [x] Admin dashboard shows real data
- [x] Payment flow works with backend
- [x] Error handling covers all scenarios
- [x] No localStorage usage for sensitive data
- [x] Session invalidation triggers auto-logout

## Testing Checklist

**Auth Flow**:
- [ ] User registration
- [ ] User login (normal + admin)
- [ ] Session validation
- [ ] Auto-logout on 401
- [ ] Logout functionality

**Orders Flow**:
- [ ] Create order
- [ ] Payment confirmation
- [ ] Order status check
- [ ] My orders listing

**Admin Flow**:
- [ ] Order listing with filters
- [ ] Order approval with license
- [ ] Order rejection
- [ ] Dashboard stats

**Error Scenarios**:
- [ ] Network offline
- [ ] Invalid token
- [ ] Session expired
- [ ] Validation errors
- [ ] Server errors

## Rollback Plan

Keep mockApi.ts as backup:
1. Rename `mockApi.ts` → `mockApi.backup.ts`
2. If issues, revert import statements
3. Git branch strategy: `feature/api-integration`

## Unresolved Questions

1. **Refresh token strategy**: Auto-refresh on 401 or manual?
2. **Loading states**: Global spinner vs component-level?
3. **Error toast library**: Use custom or add `react-hot-toast`?
4. **Request timeout**: 30s default or configurable?
5. **Retry logic**: Automatic retry on network failure?
6. **CORS handling**: Backend already configured?
7. **Session polling**: Keep 30s interval or change?

## Files Modified

**New files** (7):
- `frontend/services/apiClient.ts`
- `frontend/services/api/auth.api.ts`
- `frontend/services/api/orders.api.ts`
- `frontend/services/api/packages.api.ts`
- `frontend/services/api/admin.api.ts`
- `frontend/utils/errorHandler.ts`
- `frontend/types/api.types.ts`

**Modified files** (6):
- `frontend/vite.config.ts` (add proxy)
- `frontend/index.tsx` (session handling)
- `frontend/components/Dashboard.tsx`
- `frontend/components/Checkout.tsx`
- `frontend/components/AdminDashboard.tsx`
- `frontend/components/LandingPage.tsx`

**Deleted files** (1):
- `frontend/services/mockApi.ts` (rename to .backup)

## Timeline Estimate

- Phase 1: 2 hours
- Phase 2: 2.5 hours
- Phase 3: 2.5 hours
- Phase 4: 1.5 hours
- Phase 5: 2.5 hours
- Testing: 2 hours
- **Total**: ~13 hours

## Next Steps

1. Read phase-01 plan
2. Implement API client setup
3. Test proxy configuration
4. Proceed to phase-02
