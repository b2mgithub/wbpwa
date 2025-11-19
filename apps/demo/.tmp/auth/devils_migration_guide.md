# Devils Offline Auth API - Migration & Comparison Guide

## Quick Setup Commands

```bash
# 1. Create new .NET 9 project
dotnet new web -n DevilsOffline.Auth.Api
cd DevilsOffline.Auth.Api

# 2. Add NuGet packages
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 9.0.0
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 9.0.0
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 9.0.0
dotnet add package BCrypt.Net-Next --version 4.0.3
dotnet add package MailKit --version 4.9.0
dotnet add package Swashbuckle.AspNetCore --version 7.2.0

# 3. Install EF Core tools globally (if not already installed)
dotnet tool install --global dotnet-ef
# or update
dotnet tool update --global dotnet-ef

# 4. Create initial migration
dotnet ef migrations add InitialCreate

# 5. Apply migration to database (creates DB automatically)
dotnet ef database update

# 6. Run the API
dotnet run

# 7. Open Swagger
# Navigate to: http://localhost:5000/swagger
```

## EF Core Commands Reference

```bash
# Create a new migration
dotnet ef migrations add MigrationName

# Apply migrations to database
dotnet ef database update

# Rollback to specific migration
dotnet ef database update MigrationName

# Remove last migration (if not applied)
dotnet ef migrations remove

# List all migrations
dotnet ef migrations list

# Generate SQL script from migrations
dotnet ef migrations script

# Drop database (destructive!)
dotnet ef database drop

# View generated migration code
dotnet ef migrations script InitialCreate
```

## What's Different from Jason Watmore's Boilerplate?

### ✅ Simplified (Removed)

| Feature | Jason's .NET 6 | This .NET 9 API | Why Changed |
|---------|---------------|-----------------|-------------|
| **Architecture** | Controllers + Services | Minimal APIs | Cleaner, less boilerplate |
| **Token Rotation** | Full genealogy tracking | Simple replace | Overkill for small company |
| **IP Address Tracking** | Yes (`CreatedByIp`, `RevokedByIp`) | No | Privacy, unnecessary complexity |
| **Revoke Detection** | Recursive descendant revocation | Simple token deletion | Simpler, good enough |
| **Refresh Token TTL Cleanup** | Scheduled cleanup with configurable TTL | Cleanup on login | Less config, works fine |
| **Error Handling** | Global middleware with custom exceptions | Built-in + try-catch | Simpler, fewer layers |
| **AutoMapper** | Yes | No | Manual mapping is fine for simple DTOs |
| **Swagger Customization** | Minimal | Full OpenAPI support | Better DX |

### ✅ Kept (Essential)

| Feature | Why Kept |
|---------|----------|
| **JWT + Refresh Tokens** | Security best practice |
| **HTTP-only Cookies** | Prevents XSS attacks |
| **BCrypt Password Hashing** | Industry standard |
| **Email Verification** | Prevents fake signups |
| **Forgot/Reset Password** | Your main goal! |
| **Role-Based Auth** | Admin vs User access |
| **Token Expiry (15 min JWT, 7 day refresh)** | Good balance |

### ✅ Improved

| Feature | Improvement |
|---------|-------------|
| **.NET Version** | .NET 6 → .NET 9 (LTS, latest features) |
| **Code Style** | Classes → Records (immutable DTOs) |
| **Null Safety** | Partial → Full (`<Nullable>enable</Nullable>`) |
| **Database** | SQLite → SQL Server (production-ready) |
| **API Style** | Controllers → Minimal APIs (less code) |
| **GUID IDs** | Integer → GUID (better for distributed systems) |

## File Structure Comparison

### Jason's .NET 6 Structure
```
WebApi/
├── Authorization/
│   ├── AllowAnonymousAttribute.cs
│   ├── AuthorizeAttribute.cs
│   ├── JwtMiddleware.cs
│   └── JwtUtils.cs
├── Controllers/
│   ├── AccountsController.cs
│   └── BaseController.cs
├── Entities/
│   ├── Account.cs
│   ├── RefreshToken.cs
│   └── Role.cs
├── Helpers/
│   ├── AppException.cs
│   ├── AppSettings.cs
│   ├── AutoMapperProfile.cs
│   ├── DataContext.cs
│   └── ErrorHandlerMiddleware.cs
├── Migrations/
│   └── (EF migrations)
├── Models/
│   └── Accounts/
│       ├── AuthenticateRequest.cs
│       ├── AuthenticateResponse.cs
│       ├── RegisterRequest.cs
│       └── (10+ more files)
├── Services/
│   ├── IAccountService.cs
│   ├── AccountService.cs
│   ├── IEmailService.cs
│   └── EmailService.cs
├── appsettings.json
├── Program.cs
└── WebApi.csproj

Total: ~25 files
```

### This .NET 9 Structure
```
DevilsOffline.Auth.Api/
├── Program.cs (EVERYTHING IN ONE FILE!)
├── appsettings.json
├── appsettings.Development.json (optional)
├── DevilsOffline.Auth.Api.csproj
└── Migrations/
    └── (EF migrations)

Total: 3-4 files + migrations
```

**Line Count Comparison:**
- Jason's .NET 6: ~2,500 lines across 25+ files
- This .NET 9: ~850 lines in 1 file

**60% less code, same functionality!**

## Response Format Comparison

### Jason's Response
```json
{
  "id": 1,
  "title": "Mr",
  "firstName": "Steve",
  "lastName": "Admin",
  "email": "steve@wbenterprises.ca",
  "role": "Admin",
  "created": "2022-02-01T10:00:00Z",
  "isVerified": true,
  "jwtToken": "eyJhbG...",
  "refreshToken": "(not included, in cookie)"
}
```

### This API's Response
```json
{
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "email": "steve@wbenterprises.ca",
    "firstName": "Steve",
    "lastName": "Admin",
    "role": "Admin",
    "division": "All",
    "isVerified": true,
    "createdAt": "2025-01-15T10:30:00Z"
  },
  "accessToken": "eyJhbG..."
}
```

**Changes:**
- ✅ GUID IDs instead of integers (matches your Angular `AuthUser`)
- ✅ Nested `user` object (cleaner separation)
- ✅ Added `division` field (your requirement)
- ✅ Removed `title` field (unnecessary)
- ✅ `accessToken` instead of `jwtToken` (more accurate naming)

## Adapting Your Angular AuthService

Your existing Angular `AuthStore` expects this format:

```typescript
// Your existing AuthUser interface
export interface AuthUser {
  AccessToken: string;
  RefreshToken: string;
  UserId: string;
  Email: string;
  FirstName: string;
  LastName: string;
  Role: 'User' | 'Admin';
  Division?: 'PG' | 'Mackenzie' | 'All';
}
```

### Option A: Map the response in Angular
```typescript
// In AuthService
login(email: string, password: string): Observable<AuthResponse> {
  return this.http.post<ApiResponse>(`${this.baseUrl}/login`, { email, password })
    .pipe(
      map(response => ({
        User: {
          UserId: response.user.userId,
          Email: response.user.email,
          FirstName: response.user.firstName,
          LastName: response.user.lastName,
          Role: response.user.role,
          Division: response.user.division,
        },
        AccessToken: response.accessToken,
        RefreshToken: '' // Not sent in response body
      }))
    );
}
```

### Option B: Change the .NET API response (easier)
In `Program.cs`, change the response format to match your Angular interface:

```csharp
// In login endpoint, change from:
return Results.Ok(new AuthResponse
{
    User = response.User,
    AccessToken = response.AccessToken
});

// To match your Angular interface exactly:
return Results.Ok(new 
{
    User = new {
        UserId = response.User.UserId,
        Email = response.User.Email,
        FirstName = response.User.FirstName,
        LastName = response.User.LastName,
        Role = response.User.Role,
        Division = response.User.Division,
    },
    AccessToken = response.AccessToken,
    RefreshToken = response.RefreshToken
});
```

## Testing the API

### Using Swagger UI
1. Navigate to `http://localhost:5000/swagger`
2. Click "Try it out" on any endpoint
3. Fill in the request body
4. Click "Execute"

### Using curl
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Get users (with JWT)
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Refresh token (with cookie)
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -b cookies.txt \
  -c cookies.txt
```

### Using Postman
1. Import the Swagger JSON: `http://localhost:5000/swagger/v1/swagger.json`
2. All endpoints will be pre-configured
3. Use the Authorization tab for JWT tokens

## Production Checklist

Before deploying:

- [ ] Change JWT secret to random 64+ character string
- [ ] Use real SMTP service (SendGrid, Mailgun, AWS SES)
- [ ] Update CORS to only allow your Angular app domain
- [ ] Use environment variables instead of `appsettings.json`
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up SQL Server (not SQL Express) with backups
- [ ] Configure logging (Serilog, Application Insights)
- [ ] Add rate limiting for login/register endpoints
- [ ] Set up monitoring/alerting
- [ ] Review and harden connection strings
- [ ] Test forgot password flow end-to-end
- [ ] Document admin account recovery process

## Common Issues & Solutions

### "Unable to connect to database"
**Solution:** Check SQL Server is running:
```bash
# Windows
services.msc → SQL Server (MSSQLSERVER) → Start

# Or use SQL Server Express
Server=localhost\\SQLEXPRESS;Database=...
```

### "JWT validation failed"
**Solution:** Ensure secret is same in `appsettings.json` and at least 32 chars

### "Emails not sending"
**Solution:** Check Ethereal inbox at https://ethereal.email/messages

### "CORS error in Angular"
**Solution:** Add your Angular URL to CORS policy in `Program.cs`

### "Migration already applied"
**Solution:** 
```bash
dotnet ef database drop
dotnet ef database update
```

## Next Steps

1. ✅ Test registration flow
2. ✅ Test email verification
3. ✅ Test login with JWT
4. ✅ Test forgot/reset password
5. ✅ Connect to your Angular app
6. ✅ Test with your Reception Desk IDB
7. ✅ Deploy to staging environment
8. ✅ Configure production SMTP
9. ✅ Deploy to production

## Support

Need help? Check:
- .NET 9 Docs: https://learn.microsoft.com/en-us/aspnet/core/
- EF Core Docs: https://learn.microsoft.com/en-us/ef/core/
- JWT.io: https://jwt.io (decode/verify tokens)
- MailKit Docs: https://github.com/jstedfast/MailKit
