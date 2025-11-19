# Account ? User Migration Documentation

*Migration completed: November 2025*  
*Database: Fresh start with WBPWA (dropped AuthTest)*

---

## ?? Overview

This document captures the complete refactoring journey from the original Jason Watmore boilerplate's `Account` entity to a proper `User` entity with modern conventions, including:

1. **Email Service Migration**: SMTP (MailKit) ? Resend API
2. **Entity Rename**: `Account` ? `User`
3. **Primary Key Modernization**: `int Id` ? `Guid UserId`
4. **Property Cleanup**: Removed `Title` and `AcceptTerms`
5. **Database Reset**: Fresh start strategy (dropped old database)

---

## ?? Phase 1: SMTP ? Resend Migration

### Motivation

The original boilerplate used MailKit/MimeKit with SMTP configuration, which requires managing SMTP credentials and server connections. Modern email APIs like Resend offer:

- Simple REST API (no SMTP complexity)
- Better deliverability
- Built-in analytics
- Easier configuration

### Changes Made

#### Before (SMTP with MailKit):

```csharp
public class EmailService : IEmailService
{
    public void Send(string to, string subject, string html, string from = null)
    {
        var smtp = new SmtpClient();
        smtp.Connect(_appSettings.SmtpHost, _appSettings.SmtpPort);
        smtp.Authenticate(_appSettings.SmtpUser, _appSettings.SmtpPass);
        // ... send email
    }
}
```

**Configuration required:**
- `SmtpHost`
- `SmtpPort`
- `SmtpUser`
- `SmtpPass`
- `EmailFrom`
- `SmtpFrom`

#### After (Resend API):

```csharp
public class EmailService : IEmailService
{
    public async Task SendAsync(string to, string subject, string html, string from = null)
    {
        var resendKey = _appSettings.ResendApiKey;
        IResend resend = ResendClient.Create(resendKey);
        
        var msg = new EmailMessage()
        {
            From = fromAddress,
            To = to,
            Subject = subject,
            HtmlBody = html
        };

        await resend.EmailSendAsync(msg);
    }
}
```

**Configuration required:**
- `ResendApiKey` (via user secrets or environment variable)
- `EmailFrom`

### Benefits Achieved

? Simpler configuration (2 settings vs 6)  
? No SMTP port/authentication issues  
? Async-first implementation  
? Better error messages (Resend API responses)  
? Easier to test and debug

---

## ?? Phase 2: Account ? User Entity Refactor

### Motivation

The original boilerplate used `Account` as the entity name, but for a production application that includes:

- **Angular frontend** with user management grids
- **Offline-first PWA** with IndexedDB storage
- **Consistent naming** across entities (Blocks, Products, Productions, Rates)

We need:
1. **User** instead of Account (more intuitive)
2. **PascalCase IDs** (`UserId`, `BlockId`, `ProductId`) for consistency
3. **GUID primary keys** instead of auto-increment integers
4. **Division property** for organizational structure ('PG', 'Mackenzie', 'All')

### Database Strategy: Fresh Start

Rather than complex data migration, we chose the **clean slate approach**:

1. ? Dropped old `AuthTest` database
2. ? Created new `WBPWA` database
3. ? Updated `appsettings.json` connection string
4. ? Fresh migrations with new schema

**Why this works:**
- Development environment (no production data to preserve)
- Team can easily recreate test data
- Cleaner migration history
- No risk of migration errors

---

## ?? Complete Entity Transformation

### Before: Account Entity

```csharp
public class Account
{
    public int Id { get; set; }                    // ? Auto-increment int
    public string Title { get; set; }               // ? Removed (unnecessary)
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public bool AcceptTerms { get; set; }           // ? Removed (unnecessary)
    public Role Role { get; set; }
    public string? VerificationToken { get; set; }
    public DateTime? Verified { get; set; }
    public bool IsVerified => Verified.HasValue || PasswordReset.HasValue;
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpires { get; set; }
    public DateTime? PasswordReset { get; set; }
    public DateTime Created { get; set; }
    public DateTime? Updated { get; set; }
    public List<RefreshToken>? RefreshTokens { get; set; }
}
```

### After: User Entity

```csharp
public class User
{
    public Guid UserId { get; set; }                // ? GUID PK (PascalCase!)
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public Role Role { get; set; }
    public string? Division { get; set; }           // ? NEW: 'PG', 'Mackenzie', 'All'
    public string? VerificationToken { get; set; }
    public DateTime? Verified { get; set; }
    public bool IsVerified => Verified.HasValue || PasswordReset.HasValue;
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpires { get; set; }
    public DateTime? PasswordReset { get; set; }
    public DateTime Created { get; set; }
    public DateTime? Updated { get; set; }
    public List<RefreshToken>? RefreshTokens { get; set; }

    public bool OwnsToken(string token) 
    {
        return this.RefreshTokens?.Find(x => x.Token == token) != null;
    }
}
```

### Key Changes

| Aspect | Before | After | Reason |
|--------|--------|-------|--------|
| **Entity Name** | `Account` | `User` | More intuitive, matches frontend |
| **Primary Key** | `int Id` | `Guid UserId` | Distributed systems, client-side generation |
| **PK Convention** | camelCase | **PascalCase** | SQL Server veteran approved! ?? |
| **Title** | `string Title` | ? Removed | Unnecessary complexity |
| **AcceptTerms** | `bool AcceptTerms` | ? Removed | Can be tracked elsewhere if needed |
| **Division** | ? Missing | `string? Division` | Organizational hierarchy |

---

## ?? Cascading Changes Required

### 1. RefreshToken Foreign Key

```csharp
// Before
public class RefreshToken
{
    public int Id { get; set; }
    public int AccountId { get; set; }  // FK to Account
    // ...
}

// After
public class RefreshToken
{
    public int Id { get; set; }
    public Guid UserId { get; set; }    // FK to User (GUID)
    // ...
}
```

---

### 2. JWT Claims

```csharp
// Before
public string GenerateJwtToken(Account account)
{
    Subject = new ClaimsIdentity(new[] { 
        new Claim("id", account.Id.ToString())  // int as string
    })
}

// After
public string GenerateJwtToken(User user)
{
    Subject = new ClaimsIdentity(new[] { 
        new Claim("UserId", user.UserId.ToString())  // GUID as string (PascalCase!)
    })
}
```

---

### 3. Route Constraints

```csharp
// Before
[HttpGet("{id:int}")]
public ActionResult<AccountResponse> GetById(int id)

// After
[HttpGet("{id:guid}")]
public ActionResult<UserResponse> GetById(Guid id)
```

---

### 4. API Endpoints

| Before | After |
|--------|-------|
| `POST /accounts/register` | `POST /users/register` |
| `POST /accounts/authenticate` | `POST /users/authenticate` |
| `GET /accounts` | `GET /users` |
| `GET /accounts/{id:int}` | `GET /users/{id:guid}` |
| `PUT /accounts/{id:int}` | `PUT /users/{id:guid}` |
| `DELETE /accounts/{id:int}` | `DELETE /users/{id:guid}` |

---

### 5. Models/DTOs

**Folder rename:** `Models/Accounts/` ? `Models/Users/`

**File renames:**
- `AccountResponse.cs` ? `UserResponse.cs`
- `AuthenticateResponse.cs` (updated `Id` ? `UserId`)
- `RegisterRequest.cs` (removed `Title`, `AcceptTerms`)
- `CreateRequest.cs` (removed `Title`, added `Division`)
- `UpdateRequest.cs` (removed `Title`, added `Division`)

---

### 6. Services

```csharp
// Before
public interface IAccountService
{
    AccountResponse GetById(int id);
    // ...
}

// After
public interface IUserService
{
    UserResponse GetById(Guid userId);
    // ...
}
```

---

### 7. Controllers

```csharp
// Before
[Route("[controller]")]  // becomes /accounts
public class AccountsController : BaseController
{
    private readonly IAccountService _accountService;
}

// After
[Route("[controller]")]  // becomes /users
public class UsersController : BaseController
{
    private readonly IUserService _userService;
}
```

---

### 8. Base Controller

```csharp
// Before
public abstract class BaseController : ControllerBase
{
    public Account Account => (Account)HttpContext.Items["Account"];
}

// After
public abstract class BaseController : ControllerBase
{
    public User User => (User)HttpContext.Items["User"];
}
```

---

### 9. DataContext

```csharp
// Before
public class DataContext : DbContext
{
    public DbSet<Account> Accounts { get; set; }
}

// After
public class DataContext : DbContext
{
    public DbSet<User> Users { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.UserId).ValueGeneratedNever();  // App generates GUID
            
            entity.OwnsMany(e => e.RefreshTokens, token =>
            {
                token.WithOwner().HasForeignKey(t => t.UserId);
            });
        });
    }
}
```

---

### 10. AutoMapper Profiles

```csharp
// Before
CreateMap<Account, AccountResponse>();
CreateMap<Account, AuthenticateResponse>();
CreateMap<RegisterRequest, Account>();
CreateMap<CreateRequest, Account>();
CreateMap<UpdateRequest, Account>();

// After
CreateMap<User, UserResponse>();
CreateMap<User, AuthenticateResponse>();
CreateMap<RegisterRequest, User>();
CreateMap<CreateRequest, User>();
CreateMap<UpdateRequest, User>();
```

---

## ?? Files Modified Summary

### Created/Renamed:
- ? `Entities/User.cs` (was Account.cs)
- ? `Models/Users/` folder (was Models/Accounts/)
- ? `Models/Users/UserResponse.cs` (was AccountResponse.cs)
- ? `Services/UserService.cs` (was AccountService.cs)
- ? `Controllers/UsersController.cs` (was AccountsController.cs)
- ? `Services/EmailService.cs` (migrated to Resend)

### Updated:
- ? `Entities/RefreshToken.cs` (AccountId ? UserId)
- ? `Authorization/JwtUtils.cs` (int ? Guid, Account ? User)
- ? `Authorization/JwtMiddleware.cs` (Account ? User)
- ? `Authorization/AuthorizeAttribute.cs` (Account ? User)
- ? `Controllers/BaseController.cs` (Account ? User)
- ? `Helpers/DataContext.cs` (Accounts ? Users, GUID PK config)
- ? `Helpers/AutoMapperProfile.cs` (All mappings)
- ? `Helpers/AppSettings.cs` (Added ResendApiKey)
- ? `Program.cs` (IAccountService ? IUserService)

### Deleted:
- ? `Migrations/` (entire folder - fresh start)
- ? Old `Models/Accounts/` folder

---

## ??? Database Schema Changes

### Before: Accounts Table

```sql
CREATE TABLE Accounts (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Title NVARCHAR(MAX),
    FirstName NVARCHAR(MAX) NOT NULL,
    LastName NVARCHAR(MAX) NOT NULL,
    Email NVARCHAR(MAX) NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    AcceptTerms BIT NOT NULL,
    Role INT NOT NULL,
    VerificationToken NVARCHAR(MAX),
    Verified DATETIME2,
    ResetToken NVARCHAR(MAX),
    ResetTokenExpires DATETIME2,
    PasswordReset DATETIME2,
    Created DATETIME2 NOT NULL,
    Updated DATETIME2
);
```

### After: Users Table

```sql
CREATE TABLE Users (
    UserId UNIQUEIDENTIFIER PRIMARY KEY,
    FirstName NVARCHAR(MAX) NOT NULL,
    LastName NVARCHAR(MAX) NOT NULL,
    Email NVARCHAR(MAX) NOT NULL,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Role INT NOT NULL,
    Division NVARCHAR(MAX),
    VerificationToken NVARCHAR(MAX),
    Verified DATETIME2,
    ResetToken NVARCHAR(MAX),
    ResetTokenExpires DATETIME2,
    PasswordReset DATETIME2,
    Created DATETIME2 NOT NULL,
    Updated DATETIME2
);

CREATE TABLE RefreshToken (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Token NVARCHAR(MAX) NOT NULL,
    Expires DATETIME2 NOT NULL,
    Created DATETIME2 NOT NULL,
    CONSTRAINT FK_RefreshToken_Users_UserId 
        FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
);
```

---

## ?? Migration Execution

### Step 1: Update Configuration

```json
// appsettings.json
{
  "ConnectionStrings": {
    "ServerConnection": "Server=.;Database=WBPWA;Trusted_Connection=true;TrustServerCertificate=true;"
  },
  "AppSettings": {
    "Secret": "your-64-char-secret-here",
    "RefreshTokenTTL": 2,
    "EmailFrom": "noreply@yourapp.com",
    "ResendApiKey": "re_xxxxxxxxxxxx"  // From user secrets
  }
}
```

### Step 2: Clean Slate

```bash
# Drop old database (if exists)
# Create new WBPWA database in SQL Server Management Studio

# Delete old migrations
rm -rf Migrations/

# Clean and rebuild
dotnet clean
dotnet build
```

### Step 3: Create Fresh Migration

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Step 4: Verify

```bash
dotnet run
# Navigate to https://localhost:44332/swagger
```

---

## ?? Frontend Impact (Angular PWA)

With the backend now using `User` with `Guid UserId`, the Angular frontend can:

1. **UsersGrid Component**
   - Display users in Kendo Grid
   - Same pattern as Blocks, Products, Productions, Rates

2. **SignalStore Integration**
```typescript
   export const UsersStore = signalStore(
     { providedIn: 'root' },
     withEntities<User>(),
     withOfflineDataService(UsersAdapter),
     withOfflineSync()
   );
```

3. **IndexedDB Storage**
```typescript
   export const UsersAdapter = new EntityAdapter<User>({
     entityName: 'User',
     selectId: (user) => user.UserId,  // GUID as string
     sortComparer: (a, b) => a.LastName.localeCompare(b.LastName)
   });
```

4. **Consistent API Calls**
```typescript
   // All endpoints now follow same pattern
   GET /users          ? List<UserResponse>
   GET /users/{guid}   ? UserResponse
   POST /users         ? UserResponse
   PUT /users/{guid}   ? UserResponse
   DELETE /users/{guid} ? void
```

---

## ?? Benefits Achieved

### Technical
? **GUID Primary Keys**: Distributed-system ready, client-side generation  
? **PascalCase IDs**: Consistent with SQL Server conventions  
? **Modern Email API**: Resend instead of SMTP  
? **Cleaner Entity**: Removed unnecessary properties  
? **Consistent Naming**: User (not Account) matches domain language

### Development Experience
? **Frontend Consistency**: Users grid matches other entity grids  
? **Offline-First Ready**: GUIDs work perfectly with IndexedDB  
? **Easier Testing**: Fresh database, simple test data  
? **Better Documentation**: Clear migration path for future changes

### Production Readiness
? **Scalable IDs**: GUIDs don't reveal record counts  
? **Better Security**: No sequential ID enumeration  
? **Email Reliability**: Resend API with better deliverability  
? **Division Support**: Multi-tenant organizational structure

---

## ?? Lessons Learned

### What Worked Well

1. **Fresh Database Strategy**
   - Clean slate avoided complex data migration
   - Faster than writing migration scripts
   - Perfect for development/testing phase

2. **PascalCase Primary Keys**
   - Honors SQL Server conventions (40 years strong! ??)
   - Consistent across all entities
   - Easier to read in queries

3. **GUID Generation**
   - `Guid.NewGuid()` in application code
   - `ValueGeneratedNever()` in EF Core configuration
   - Client can generate IDs before API call

4. **Resend Migration**
   - Simpler configuration
   - Better error messages
   - Async-first from the start

### What We'd Do Differently

1. **Incremental Changes**
   - Could have done SMTP ? Resend first
   - Then Account ? User separately
   - But combined approach worked due to fresh DB

2. **More Unit Tests**
   - Could have added tests before refactor
   - Would catch any regression
   - Good candidate for next sprint

---

## ?? Future Enhancements

### Planned
- [ ] Add `Division` to all user-related queries
- [ ] Implement division-based row-level security
- [ ] Create UsersGrid component in Angular
- [ ] Add user bulk import/export

### Considered
- [ ] Add `LastLogin` timestamp
- [ ] Add `ProfilePictureUrl` for avatars
- [ ] Add `PhoneNumber` for 2FA
- [ ] Add `Timezone` for user preferences

---

## ?? Team Communication

### The Joke That Started It All

> **Dilbert:** When I was your age we didn't have all these fancy 'claude agents' to do our programming.  
> **Wally:** I once wrote a whole database with only ones and zeros.  
> **Dilbert:** You are lucky to have zeros, I had to use the letter O.
> 
> *- Inspired by Monty Python's Four Yorkshiremen*

This refactor honors the old-school SQL Server wisdom (PascalCase GUIDs!) while embracing modern tooling (Resend API, async/await, distributed IDs).

---

## ?? References

- Original Boilerplate: [Jason Watmore's .NET 6 Tutorial](https://jasonwatmore.com/post/2022/02/26/net-6-boilerplate-api-tutorial-with-email-sign-up-verification-authentication-forgot-password)
- Resend Documentation: [https://resend.com/docs](https://resend.com/docs)
- EF Core GUID Keys: [Microsoft Docs](https://learn.microsoft.com/en-us/ef/core/modeling/keys)
- Monty Python Reference: [Four Yorkshiremen Sketch](https://www.youtube.com/watch?v=8eXj97stbG8)

---

*Documentation created: November 23, 2025*  
*Migration completed by: Development Team with AI assistance*  
*Status: ? Complete - Ready for Phase 2 (JWT Claims Update)*
