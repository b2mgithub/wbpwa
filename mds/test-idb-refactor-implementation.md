# Create Test IDB Page and Reorganize Navigation

This task reorganizes the drawer navigation to improve usability and creates a diagnostic page to inspect IndexedDB state without DevTools.

## Proposed Changes

### Navigation Reorganization

#### [MODIFY] [app.html](file:///c:/Sandbox/devils-offline%2015%20signal%20forms/apps/demo/src/app/app.html)

Reorganize drawer items to prevent pixel scrolling:

- Move Login/Logout items (lines 118-140) above Smart Grid and test links (lines 82-117)
- This puts authentication controls at the top where they're easily accessible
- Testing/diagnostic links will be below, reducing need to scroll in the drawer

### Test IDB Page

#### [NEW] [test-idb.component.ts](file:///c:/Sandbox/devils-offline%2015%20signal%20forms/apps/demo/src/app/test-idb/test-idb.component.ts)

Create a new diagnostic component that displays:

- **Auth Database (`DevilsOffline-Auth`)**
  - Current user information from `currentUser` object store
  - Database version and metadata
- **User-Specific Database (`DevilsOfflineDB-{userId}`)**
  - List of all object stores
  - Count of records in each store
  - Sample data from each store
- **Auth Store State**
  - Display current `authStore` signal values
  - Show `isAuthenticated()` and `isAdmin()` states
- **Real-time Updates**
  - Auto-refresh capability to show state changes

#### [NEW] [test-idb.component.html](file:///c:/Sandbox/devils-offline%2015%20signal%20forms/apps/demo/src/app/test-idb/test-idb.component.html)

Template to display IDB information in a readable format using Kendo UI components:

- Tables to show object store contents
- Cards/panels to organize different databases
- Refresh button to reload state

#### [NEW] [test-idb.component.css](file:///c:/Sandbox/devils-offline%2015%20signal%20forms/apps/demo/src/app/test-idb/test-idb.component.css)

Styles for the diagnostic page.

---

#### [MODIFY] [app.routes.ts](file:///c:/Sandbox/devils-offline%2015%20signal%20forms/apps/demo/src/app/app.routes.ts)

Add route for test-idb page:

```typescript
{ path: 'test-idb', component: TestIdbComponent }
```

Note: No `authGuard` so it can be accessed both before and after login.

---

#### [MODIFY] [app.html](file:///c:/Sandbox/devils-offline%2015%20signal%20forms/apps/demo/src/app/app.html)

Add navigation link to test-idb in the drawer (placed with other test links).

## Verification Plan

### Automated Tests

None - this is a UI/diagnostic feature that requires manual verification.

### Manual Verification

1. **Navigation Order Test**

   - Open http://localhost:4200
   - Toggle the drawer
   - Verify order is: Login/Logout → Productions/Blocks/etc → Smart Grid → Test links
   - Confirm no pixel scrolling is needed to see login/logout

2. **Test IDB Page - Logged Out State**

   - Navigate to http://localhost:4200/test-idb
   - Verify it shows:
     - Auth database is empty or shows no user
     - No user-specific database
     - Auth state shows `isAuthenticated: false`

3. **Login → Test IDB Cycle**

   - Login with `steve@wbenterprises.ca` / `password`
   - Navigate to `/test-idb`
   - Verify it shows:
     - Auth database with current user (steve@wbenterprises.ca)
     - User-specific database (`DevilsOfflineDB-1` or similar)
     - Object stores and their data
     - Auth state shows `isAuthenticated: true`, user email, etc.

4. **Logout → Test IDB Cycle**

   - Click logout
   - Navigate to `/test-idb`
   - Verify it shows:
     - Auth database is cleared
     - User-specific database is deleted
     - Auth state shows `isAuthenticated: false`

5. **Reload Persistence Test**
   - Login
   - Navigate to `/test-idb`
   - Note the displayed state
   - Reload the browser (F5)
   - Verify `/test-idb` shows the same authenticated state
