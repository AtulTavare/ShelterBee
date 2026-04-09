# AGENTS.md

This file provides guidance to agents when working with code in this repository.

### Critical Non-Obvious Patterns:
1. Authentication flow requires both `AuthContext.tsx` AND manual token verification in `firebase.ts`
2. Property listing data comes from two sources:
   - `mockProperties.ts` for development
   - `propertyService.ts` for production (requires Firebase config)
3. Admin functions are isolated in `/pages/admin` but share UI components from `/components/admin`

### Special Build Requirements:
1. Must run `generate_policies.js` AFTER changing any policy pages
2. `check_db.ts` must be executed before production deployments
3. Vite config has special Firebase aliases in `vite.config.ts`

### Non-Standard Practices:
1. Error handling must use both:
   - `ErrorBoundary.tsx` for UI
   - `firestoreErrorHandler.ts` for backend
2. Toast notifications require wrapper from `toast.ts` (direct usage won't work)
3. Gemini service has strict rate limiting not documented in code