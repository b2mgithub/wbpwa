using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Configure JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"] 
    ?? throw new InvalidOperationException("JWT Secret not configured");
var key = Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero // Tokens expire exactly at expiration time
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireClaim("role", "Admin"));
    options.AddPolicy("User", policy => policy.RequireClaim("role", "User", "Admin"));
});

builder.Services.AddCors();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(x => x
    .SetIsOriginAllowed(origin => true)
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());

app.UseAuthentication();
app.UseAuthorization();

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

// Register new account
app.MapPost("/api/auth/register", async (RegisterRequest req, IAuthService auth) =>
{
    await auth.RegisterAsync(req);
    return Results.Ok(new { message = "Registration successful. Please check your email to verify your account." });
})
.WithName("Register")
.WithOpenApi();

// Verify email
app.MapPost("/api/auth/verify-email", async (VerifyEmailRequest req, IAuthService auth) =>
{
    await auth.VerifyEmailAsync(req.Token);
    return Results.Ok(new { message = "Email verified successfully. You can now login." });
})
.WithName("VerifyEmail")
.WithOpenApi();

// Login
app.MapPost("/api/auth/login", async (LoginRequest req, IAuthService auth, HttpContext context) =>
{
    var response = await auth.LoginAsync(req.Email, req.Password, GetIpAddress(context));
    
    // Set refresh token in HTTP-only cookie
    context.Response.Cookies.Append("refreshToken", response.RefreshToken, new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Expires = DateTimeOffset.UtcNow.AddDays(7)
    });
    
    return Results.Ok(new AuthResponse
    {
        User = response.User,
        AccessToken = response.AccessToken
    });
})
.WithName("Login")
.WithOpenApi();

// Refresh token
app.MapPost("/api/auth/refresh-token", async (IAuthService auth, HttpContext context) =>
{
    var refreshToken = context.Request.Cookies["refreshToken"];
    if (string.IsNullOrEmpty(refreshToken))
        return Results.BadRequest(new { message = "Refresh token is required" });
    
    var response = await auth.RefreshTokenAsync(refreshToken, GetIpAddress(context));
    
    // Set new refresh token in cookie
    context.Response.Cookies.Append("refreshToken", response.RefreshToken, new CookieOptions
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.Strict,
        Expires = DateTimeOffset.UtcNow.AddDays(7)
    });
    
    return Results.Ok(new AuthResponse
    {
        User = response.User,
        AccessToken = response.AccessToken
    });
})
.WithName("RefreshToken")
.WithOpenApi();

// Revoke token (logout)
app.MapPost("/api/auth/revoke-token", async (IAuthService auth, HttpContext context) =>
{
    var refreshToken = context.Request.Cookies["refreshToken"];
    if (string.IsNullOrEmpty(refreshToken))
        return Results.BadRequest(new { message = "Refresh token is required" });
    
    await auth.RevokeTokenAsync(refreshToken);
    
    // Clear cookie
    context.Response.Cookies.Delete("refreshToken");
    
    return Results.Ok(new { message = "Token revoked successfully" });
})
.RequireAuthorization("User")
.WithName("RevokeToken")
.WithOpenApi();

// Forgot password
app.MapPost("/api/auth/forgot-password", async (ForgotPasswordRequest req, IAuthService auth, HttpContext context) =>
{
    var origin = context.Request.Headers["Origin"].ToString();
    await auth.ForgotPasswordAsync(req.Email, origin);
    return Results.Ok(new { message = "Please check your email for password reset instructions" });
})
.WithName("ForgotPassword")
.WithOpenApi();

// Reset password
app.MapPost("/api/auth/reset-password", async (ResetPasswordRequest req, IAuthService auth) =>
{
    await auth.ResetPasswordAsync(req.Token, req.Password);
    return Results.Ok(new { message = "Password reset successful. You can now login with your new password." });
})
.WithName("ResetPassword")
.WithOpenApi();

// ============================================================================
// USER MANAGEMENT ENDPOINTS (Admin only)
// ============================================================================

// Get all users
app.MapGet("/api/users", async (AppDbContext db) =>
{
    var users = await db.Users
        .Select(u => new UserResponse
        {
            UserId = u.UserId,
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Role = u.Role,
            Division = u.Division,
            IsVerified = u.IsVerified,
            CreatedAt = u.CreatedAt
        })
        .ToListAsync();
    
    return Results.Ok(users);
})
.RequireAuthorization("Admin")
.WithName("GetAllUsers")
.WithOpenApi();

// Get user by ID
app.MapGet("/api/users/{id:guid}", async (Guid id, AppDbContext db, ClaimsPrincipal user) =>
{
    var userId = user.FindFirst("id")?.Value;
    var role = user.FindFirst("role")?.Value;
    
    // Users can only get their own info, admins can get anyone's
    if (role != "Admin" && userId != id.ToString())
        return Results.Forbid();
    
    var dbUser = await db.Users.FindAsync(id);
    if (dbUser == null)
        return Results.NotFound(new { message = "User not found" });
    
    var response = new UserResponse
    {
        UserId = dbUser.UserId,
        Email = dbUser.Email,
        FirstName = dbUser.FirstName,
        LastName = dbUser.LastName,
        Role = dbUser.Role,
        Division = dbUser.Division,
        IsVerified = dbUser.IsVerified,
        CreatedAt = dbUser.CreatedAt
    };
    
    return Results.Ok(response);
})
.RequireAuthorization("User")
.WithName("GetUserById")
.WithOpenApi();

// Update user
app.MapPut("/api/users/{id:guid}", async (Guid id, UpdateUserRequest req, AppDbContext db, ClaimsPrincipal user) =>
{
    var userId = user.FindFirst("id")?.Value;
    var role = user.FindFirst("role")?.Value;
    
    // Users can only update their own info, admins can update anyone's
    if (role != "Admin" && userId != id.ToString())
        return Results.Forbid();
    
    var dbUser = await db.Users.FindAsync(id);
    if (dbUser == null)
        return Results.NotFound(new { message = "User not found" });
    
    // Update fields
    if (!string.IsNullOrEmpty(req.FirstName))
        dbUser.FirstName = req.FirstName;
    if (!string.IsNullOrEmpty(req.LastName))
        dbUser.LastName = req.LastName;
    if (!string.IsNullOrEmpty(req.Email))
        dbUser.Email = req.Email;
    
    // Only admins can change role and division
    if (role == "Admin")
    {
        if (!string.IsNullOrEmpty(req.Role))
            dbUser.Role = req.Role;
        if (!string.IsNullOrEmpty(req.Division))
            dbUser.Division = req.Division;
    }
    
    // Handle password change
    if (!string.IsNullOrEmpty(req.Password))
    {
        dbUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
    }
    
    dbUser.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync();
    
    return Results.Ok(new { message = "User updated successfully" });
})
.RequireAuthorization("User")
.WithName("UpdateUser")
.WithOpenApi();

// Delete user
app.MapDelete("/api/users/{id:guid}", async (Guid id, AppDbContext db, ClaimsPrincipal user) =>
{
    var userId = user.FindFirst("id")?.Value;
    var role = user.FindFirst("role")?.Value;
    
    // Users can only delete their own account, admins can delete anyone's
    if (role != "Admin" && userId != id.ToString())
        return Results.Forbid();
    
    var dbUser = await db.Users.FindAsync(id);
    if (dbUser == null)
        return Results.NotFound(new { message = "User not found" });
    
    db.Users.Remove(dbUser);
    await db.SaveChangesAsync();
    
    return Results.Ok(new { message = "User deleted successfully" });
})
.RequireAuthorization("User")
.WithName("DeleteUser")
.WithOpenApi();

app.Run();

// ============================================================================
// HELPER METHODS
// ============================================================================

static string GetIpAddress(HttpContext context)
{
    if (context.Request.Headers.ContainsKey("X-Forwarded-For"))
        return context.Request.Headers["X-Forwarded-For"].ToString();
    return context.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "unknown";
}

// ============================================================================
// MODELS
// ============================================================================

public record RegisterRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? Division = null
);

public record LoginRequest(string Email, string Password);

public record VerifyEmailRequest(string Token);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Token, string Password);

public record UpdateUserRequest(
    string? FirstName,
    string? LastName,
    string? Email,
    string? Password,
    string? Role,
    string? Division
);

public record AuthResponse
{
    public UserResponse User { get; init; } = null!;
    public string AccessToken { get; init; } = null!;
}

public record UserResponse
{
    public Guid UserId { get; init; }
    public string Email { get; init; } = null!;
    public string FirstName { get; init; } = null!;
    public string LastName { get; init; } = null!;
    public string Role { get; init; } = null!;
    public string? Division { get; init; }
    public bool IsVerified { get; init; }
    public DateTime CreatedAt { get; init; }
}

// ============================================================================
// ENTITIES
// ============================================================================

public class User
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Role { get; set; } = "User"; // "User" or "Admin"
    public string? Division { get; set; } // "PG", "Mackenzie", "All"
    public bool IsVerified { get; set; }
    public string? VerificationToken { get; set; }
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpires { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    public List<RefreshToken> RefreshTokens { get; set; } = new();
}

public class RefreshToken
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsActive => !IsExpired;
}

// ============================================================================
// DATABASE CONTEXT
// ============================================================================

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.LastName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Role).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Division).HasMaxLength(50);
        });
        
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.Property(e => e.Token).HasMaxLength(255).IsRequired();
            
            entity.HasOne(e => e.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

// ============================================================================
// SERVICES
// ============================================================================

public interface IAuthService
{
    Task RegisterAsync(RegisterRequest request);
    Task VerifyEmailAsync(string token);
    Task<(UserResponse User, string AccessToken, string RefreshToken)> LoginAsync(string email, string password, string ipAddress);
    Task<(UserResponse User, string AccessToken, string RefreshToken)> RefreshTokenAsync(string token, string ipAddress);
    Task RevokeTokenAsync(string token);
    Task ForgotPasswordAsync(string email, string origin);
    Task ResetPasswordAsync(string token, string newPassword);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly IEmailService _email;
    
    public AuthService(AppDbContext db, IConfiguration config, IEmailService email)
    {
        _db = db;
        _config = config;
        _email = email;
    }
    
    public async Task RegisterAsync(RegisterRequest request)
    {
        // Check if email already exists
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            throw new Exception("Email already registered");
        
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Division = request.Division,
            Role = await _db.Users.AnyAsync() ? "User" : "Admin", // First user is admin
            IsVerified = false,
            VerificationToken = GenerateToken(),
            CreatedAt = DateTime.UtcNow
        };
        
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        
        // Send verification email
        await _email.SendVerificationEmailAsync(user.Email, user.VerificationToken);
    }
    
    public async Task VerifyEmailAsync(string token)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.VerificationToken == token);
        if (user == null)
            throw new Exception("Invalid verification token");
        
        user.IsVerified = true;
        user.VerificationToken = null;
        await _db.SaveChangesAsync();
    }
    
    public async Task<(UserResponse User, string AccessToken, string RefreshToken)> LoginAsync(
        string email, string password, string ipAddress)
    {
        var user = await _db.Users
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Email == email);
        
        if (user == null || !user.IsVerified || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            throw new Exception("Email or password is incorrect");
        
        // Generate tokens
        var accessToken = GenerateJwtToken(user);
        var refreshToken = new RefreshToken
        {
            UserId = user.UserId,
            Token = GenerateToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        
        user.RefreshTokens.Add(refreshToken);
        
        // Clean up old expired tokens
        user.RefreshTokens.RemoveAll(t => t.IsExpired);
        
        await _db.SaveChangesAsync();
        
        var userResponse = new UserResponse
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            Division = user.Division,
            IsVerified = user.IsVerified,
            CreatedAt = user.CreatedAt
        };
        
        return (userResponse, accessToken, refreshToken.Token);
    }
    
    public async Task<(UserResponse User, string AccessToken, string RefreshToken)> RefreshTokenAsync(
        string token, string ipAddress)
    {
        var refreshToken = await _db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Token == token);
        
        if (refreshToken == null || !refreshToken.IsActive)
            throw new Exception("Invalid refresh token");
        
        var user = refreshToken.User;
        
        // Generate new tokens
        var accessToken = GenerateJwtToken(user);
        var newRefreshToken = new RefreshToken
        {
            UserId = user.UserId,
            Token = GenerateToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
        
        // Remove old token and add new one
        _db.RefreshTokens.Remove(refreshToken);
        _db.RefreshTokens.Add(newRefreshToken);
        
        await _db.SaveChangesAsync();
        
        var userResponse = new UserResponse
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            Division = user.Division,
            IsVerified = user.IsVerified,
            CreatedAt = user.CreatedAt
        };
        
        return (userResponse, accessToken, newRefreshToken.Token);
    }
    
    public async Task RevokeTokenAsync(string token)
    {
        var refreshToken = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token);
        if (refreshToken == null)
            throw new Exception("Invalid token");
        
        _db.RefreshTokens.Remove(refreshToken);
        await _db.SaveChangesAsync();
    }
    
    public async Task ForgotPasswordAsync(string email, string origin)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
            return; // Don't reveal if email exists
        
        user.ResetToken = GenerateToken();
        user.ResetTokenExpires = DateTime.UtcNow.AddHours(24);
        await _db.SaveChangesAsync();
        
        await _email.SendPasswordResetEmailAsync(user.Email, user.ResetToken, origin);
    }
    
    public async Task ResetPasswordAsync(string token, string newPassword)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => 
            u.ResetToken == token && u.ResetTokenExpires > DateTime.UtcNow);
        
        if (user == null)
            throw new Exception("Invalid or expired reset token");
        
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.ResetToken = null;
        user.ResetTokenExpires = null;
        user.UpdatedAt = DateTime.UtcNow;
        
        await _db.SaveChangesAsync();
    }
    
    private string GenerateJwtToken(User user)
    {
        var secret = _config["JwtSettings:Secret"] ?? throw new Exception("JWT Secret not configured");
        var key = Encoding.ASCII.GetBytes(secret);
        
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim("id", user.UserId.ToString()),
                new Claim("email", user.Email),
                new Claim("role", user.Role)
            }),
            Expires = DateTime.UtcNow.AddMinutes(15),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };
        
        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
    
    private static string GenerateToken()
    {
        return Convert.ToHexString(RandomNumberGenerator.GetBytes(64));
    }
}

// ============================================================================
// EMAIL SERVICE
// ============================================================================

public interface IEmailService
{
    Task SendVerificationEmailAsync(string to, string token);
    Task SendPasswordResetEmailAsync(string to, string token, string origin);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    
    public EmailService(IConfiguration config)
    {
        _config = config;
    }
    
    public async Task SendVerificationEmailAsync(string to, string token)
    {
        var subject = "Devils Offline - Verify Your Email";
        var html = $@"
            <h2>Verify Your Email</h2>
            <p>Thanks for registering with Devils Offline!</p>
            <p>Please use the following token to verify your email address:</p>
            <p><strong>{token}</strong></p>
            <p>This token will expire in 24 hours.</p>
        ";
        
        await SendEmailAsync(to, subject, html);
    }
    
    public async Task SendPasswordResetEmailAsync(string to, string token, string origin)
    {
        var subject = "Devils Offline - Reset Your Password";
        var resetUrl = !string.IsNullOrEmpty(origin) 
            ? $"{origin}/reset-password?token={token}"
            : token;
        
        var html = $@"
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password.</p>
            <p>Please use the following token to reset your password:</p>
            <p><strong>{token}</strong></p>
            <p>Or click this link: <a href=""{resetUrl}"">{resetUrl}</a></p>
            <p>This token will expire in 24 hours.</p>
            <p>If you didn't request this, please ignore this email.</p>
        ";
        
        await SendEmailAsync(to, subject, html);
    }
    
    private async Task SendEmailAsync(string to, string subject, string html)
    {
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(_config["EmailSettings:From"]));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart(TextFormat.Html) { Text = html };
        
        using var smtp = new SmtpClient();
        await smtp.ConnectAsync(
            _config["EmailSettings:Host"],
            int.Parse(_config["EmailSettings:Port"] ?? "587"),
            SecureSocketOptions.StartTls);
        
        await smtp.AuthenticateAsync(
            _config["EmailSettings:User"],
            _config["EmailSettings:Password"]);
        
        await smtp.SendAsync(message);
        await smtp.DisconnectAsync(true);
    }
}