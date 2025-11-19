# Simplify Auth Storage to Reception Desk Only

## Problem

Currently, auth state is persisted in **three** places:

1. **SignalStore** (in-memory reactive state)
2. **Reception Desk** (`DevilsOffline-Auth` via `authDB.setCurrentUser()`)
3. **User-specific DB** (`DevilsOfflineDB-{UserId}` via `adapter.persistState('Auth-user', ...)`)

This is redundant. Auth should live **only** in the Reception Desk.

## Proposed Changes

### [libs/auth/data-access/src/lib/auth.store.ts](file:///c:/Sandbox/devils-offline%2015%20signal%20forms/libs/auth/data-access/src/lib/auth.store.ts)

**Remove:**

- All references to `AuthAdapter` (lines 11, 59, 95-96, 158)
- `STORAGE_KEY = 'Auth-user'` (line 61)
- `adapter.persistState()` call in login (line 96)
- `adapter.init()` calls (lines 95, 158)

**Keep:**

- `authDB.setCurrentUser()` in login (line 89) ✅
- `authDB.getCurrentUser()` in syncFromStorage (line 151) ✅
- `authDB.clearCurrentUser()` in logout (line 135) ✅
- SignalStore for reactive state management ✅

**Reasoning:**

- SignalStore provides reactive computed signals (`isAdmin`, `accessToken`, `userId`, etc.)
- Reception Desk provides persistence across sessions
- No need for adapter or user-specific DB storage for auth

---

### [libs/auth/data-access/src/lib/auth.adapter.ts](file:///c:/Sandbox/devils-offline%2015%20signal%20forms/libs/auth/data-access/src/lib/auth.adapter.ts)

**Action:** DELETE this file entirely

- Only used for auth persistence to user DB
- No longer needed

---

### [libs/auth/data-access/src/index.ts](file:///c:/Sandbox/devils-offline%2015%20signal%20forms/libs/auth/data-access/src/index.ts)

**Remove:**

- Export of `AuthAdapter` (if present)

---

## Auth Flow After Changes

### Login

```
1. Validate credentials via AuthService
2. Update SignalStore state (user, isAuthenticated)
3. authDB.setCurrentUser(authUser)  ← Reception Desk ONLY
4. devilsOfflineDB.switchDatabase(userId)  ← Open user data DB
5. Navigate to home
```

### Logout

```
1. Clear SignalStore state
2. authDB.clearCurrentUser()  ← Clear Reception Desk
3. devilsOfflineDB.deleteCurrentDatabase()  ← Delete user data
4. Navigate to login
```

### Startup (syncFromStorage)

```
1. authDB.getCurrentUser()  ← Read from Reception Desk
2. If found:
   - Update SignalStore state
   - devilsOfflineDB.switchDatabase(userId)
3. Set isInitialized = true
```

---

## Verification Plan

### Automated Testing

No existing unit tests found for auth. Manual browser testing required.

### Manual Browser Testing

**Test 1: Login → Test IDB → Verify Auth in Reception Desk**

1. Start dev server: `npm run serve`
2. Navigate to http://localhost:4200
3. Login with steve@wbenterprises.ca / DevilsOffline!2025
4. Navigate to "Test IDB"
5. **Verify:**
   - `isAuthenticated: ✅ true`
   - `userId: 550e8400-e29b-41d4-a716-446655440001`
   - Auth DB section shows user data
   - User Object shows Steve Admin details

**Test 2: Logout → Test IDB → Verify Auth Cleared**

1. From previous test, click "Logout"
2. Navigate to "Test IDB"
3. **Verify:**
   - `isAuthenticated: ❌ false`
   - `userId: null`
   - Auth DB shows "No user stored"
   - User Object shows null

**Test 3: Refresh → Verify Session Persistence**

1. Login with steve@wbenterprises.ca
2. Hard refresh browser (Ctrl+R or F5)
3. **Verify:**
   - Still logged in (no redirect to login page)
   - User details visible in app
4. Navigate to "Test IDB"
5. **Verify:**
   - `isAuthenticated: ✅ true`
   - Auth DB still shows user data

**Test 4: Developer Tools → Verify Database Structure**

1. Open Chrome DevTools → Application → IndexedDB
2. **Verify:**
   - `DevilsOffline-Auth` database exists
   - Contains `currentUser` object store with 'current' key
   - User object has: UserId, Email, FirstName, LastName, Role, AccessToken, RefreshToken
3. **Verify:**
   - `DevilsOfflineDB-{UserId}` database exists
   - Does NOT contain auth data (no 'Auth-user' in states table)

---

## Success Criteria

✅ Auth stored ONLY in Reception Desk (`DevilsOffline-Auth`)  
✅ User-specific DB contains NO auth data  
✅ Login/logout flow works correctly  
✅ Session persists on refresh  
✅ SignalStore provides reactive auth state  
✅ No adapter or redundant persistence code
