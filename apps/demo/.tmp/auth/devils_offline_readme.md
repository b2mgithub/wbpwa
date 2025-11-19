# Devils Offline Auth API

Simplified .NET 9 Minimal API for authentication with JWT tokens, refresh tokens, email verification, and password reset.

## Features

✅ User registration with email verification  
✅ Login with JWT access tokens (15 min expiry)  
✅ Refresh tokens (7 days, HTTP-only cookies)  
✅ Forgot password / Reset password flow  
✅ Role-based authorization (Admin, User)  
✅ Division support (PG, Mackenzie, All)  
✅ User management (CRUD) with role-based access  

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- SQL Server (or SQL Server Express)
- SMTP server (use [Ethereal](https://ethereal.email) for testing)

## Quick Start

### 1. Configure Database

Edit `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=DevilsOfflineAuth;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

For SQL Server Express, use:
```json
"Server=localhost\\SQLEXPRESS;Database=DevilsOfflineAuth;..."
```

### 2. Configure JWT Secret

**IMPORTANT:** Generate a random secret for production:

```bash
# Generate two GUIDs and concatenate them
# Example: a3f7d2e1-4b9c-8f6a-1d3e-7c2b5a9f8e6d-b2c4d6f8-a1e3-5g7h-9j1k-3l5m7n9p1q3r
```

Update `appsettings.json`:
```json
"JwtSettings": {
  "Secret": "YOUR-SUPER-SECRET-KEY-AT-LEAST-32-CHARS"
}
```

### 3. Configure Email (for testing)

Go to [https://ethereal.email](https://ethereal.email) and click "Create Ethereal Account".

Copy the SMTP credentials to `appsettings.json`:

```json
"EmailSettings": {
  "From": "[email protected]",
  "Host": "smtp.ethereal.email",
  "Port": "587",
  "User": "your-generated-username",
  "Password": "your-generated-password"
}
```

**Note:** Ethereal emails don't actually send—they're captured in your Ethereal inbox for testing.

### 4. Create Database Migration

```bash
dotnet ef migrations add InitialCreate
```

### 5. Run the API

```bash
dotnet run
```

The API will start at `http://localhost:5000` (or `https://localhost:5001`).

Swagger documentation: `http://localhost:5000/swagger`

## Database Schema

### Users Table
```sql
UserId (GUID, PK)
Email (VARCHAR(255), UNIQUE)
PasswordHash (VARCHAR(255))
FirstName (VARCHAR(100))
LastName (VARCHAR(100))
Role (VARCHAR(20)) -- 'Admin' or 'User'
Division (VARCHAR(50)) -- 'PG', 'Mackenzie', 'All'
IsVerified (BIT)
VerificationToken (VARCHAR(255), NULLABLE)
ResetToken (VARCHAR(255), NULLABLE)
ResetTokenExpires (DATETIME, NULLABLE)
CreatedAt (DATETIME)
UpdatedAt (DATETIME, NULLABLE)
```

### RefreshTokens Table
```sql
Id (INT, PK, IDENTITY)
UserId (GUID, FK)
Token (VARCHAR(255), UNIQUE)
ExpiresAt (DATETIME)
CreatedAt (DATETIME)
```

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/verify-email` | Verify email with token |
| POST | `/api/auth/login` | Login and get JWT + refresh token |
| POST | `/api/auth/refresh-token` | Get new JWT using refresh token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Protected Endpoints (Requires JWT)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/revoke-token` | User | Logout (revoke refresh token) |
| GET | `/api/users` | Admin | Get all users |
| GET | `/api/users/{id}` | User* | Get user by ID |
| PUT | `/api/users/{id}` | User* | Update user |
| DELETE | `/api/users/{id}` | User* | Delete user |

*Users can only access/modify their own account, Admins can access/modify any account.

## Example Requests

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "steve@wbenterprises.ca",
    "password": "DevilsOffline!2025",
    "firstName": "Steve",
    "lastName": "Admin",
    "division": "All"
  }'
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify your account."
}
```

### Verify Email
Check your Ethereal inbox for the verification token, then:

```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_VERIFICATION_TOKEN_FROM_EMAIL"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "steve@wbenterprises.ca",
    "password": "DevilsOffline!2025"
  }'
```

**Response:**
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
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** The refresh token is returned as an HTTP-only cookie named `refreshToken`.

### Get All Users (Admin Only)
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update User
```bash
curl -X PUT http://localhost:5000/api/users/550e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Steven",
    "password": "NewPassword!2025"
  }'
```

## Security Features

✅ **Password hashing** with BCrypt (cost factor 11)  
✅ **JWT tokens** expire after 15 minutes  
✅ **Refresh tokens** expire after 7 days  
✅ **HTTP-only cookies** for refresh tokens (prevents XSS)  
✅ **Email verification** required before login  
✅ **Password reset tokens** expire after 24 hours  
✅ **Role-based authorization** (Admin vs User)  
✅ **Expired tokens** automatically cleaned up  

## Production Deployment

### 1. Use a Real Email Service

Replace Ethereal with:
- **SendGrid** (100 emails/day free)
- **Mailgun** (5,000 emails/month free)
- **AWS SES**
- **Office 365 / Gmail SMTP**

### 2. Use Environment Variables

Instead of `appsettings.json`, use environment variables:

```bash
export ConnectionStrings__DefaultConnection="Server=..."
export JwtSettings__Secret="your-production-secret"
export EmailSettings__Host="smtp.sendgrid.net"
export EmailSettings__User="apikey"
export EmailSettings__Password="your-sendgrid-api-key"
```

### 3. Enable HTTPS

```csharp
// In Program.cs, before app.Run()
app.UseHttpsRedirection();
```

### 4. Configure CORS

Update the CORS policy to only allow your Angular app:

```csharp
app.UseCors(x => x
    .WithOrigins("https://yourdomain.com")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());
```

## Connecting to Angular

Update your Angular `AuthService` to point to this API:

```typescript
// auth.service.ts
private baseUrl = 'http://localhost:5000/api/auth';
```

The response format matches your existing Angular interface:

```typescript
export interface AuthResponse {
  User: {
    UserId: string;
    Email: string;
    FirstName: string;
    LastName: string;
    Role: 'User' | 'Admin';
    Division?: 'PG' | 'Mackenzie' | 'All';
  };
  AccessToken: string;
  RefreshToken: string; // Only in dev, not sent over wire in prod
}
```

## Troubleshooting

### Database connection fails
- Ensure SQL Server is running
- Check connection string in `appsettings.json`
- For SQL Server Express, use `Server=localhost\\SQLEXPRESS`

### Emails not sending
- Check Ethereal inbox at https://ethereal.email/messages
- Verify SMTP credentials in `appsettings.json`
- Check firewall isn't blocking port 587

### JWT validation fails
- Ensure JWT secret is at least 32 characters
- Check token hasn't expired (15 min lifetime)
- Verify `Authorization: Bearer <token>` header format

### CORS errors
- Update CORS policy in `Program.cs` with your Angular app URL
- Ensure `AllowCredentials()` is enabled for refresh token cookies

## Migration from .NET 6

This API is designed as a drop-in replacement for Jason Watmore's .NET 6 boilerplate. Key differences:

✅ Minimal APIs instead of Controllers  
✅ Simplified token management (no token rotation genealogy)  
✅ No IP address tracking or audit trails  
✅ Cleaner, more readable code  
✅ .NET 9 with latest packages  

## License

MIT - Use freely for your Devils Offline project!
