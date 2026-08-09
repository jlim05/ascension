using Scalar.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Ascension.Api.Data;
using Ascension.Api.Models;
using System.Text;
using Ascension.Api.Services;
using Ascension.Api.Hubs;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// ── Hosting ───────────────────────────────────────────────
// Render assigns the port at runtime via PORT and expects the app to bind
// 0.0.0.0. Locally there is no PORT, so launchSettings.json (5202) wins.
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// Render terminates TLS at its edge and forwards plain HTTP, so the original
// scheme and client IP only survive in the X-Forwarded-* headers. The proxy IP
// isn't known ahead of time, hence the cleared allow-lists.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// ── Database ─────────────────────────────────────────────
builder.Services.AddDbContext<AscensionDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Identity ─────────────────────────────────────────────
builder.Services.AddIdentity<Player, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
})
.AddEntityFrameworkStores<AscensionDbContext>()
.AddDefaultTokenProviders();

// ── CORS ──────────────────────────────────────────────────
// The local dev origin is always allowed; deployed origins come from config so
// the Vercel URL can change without a code change and a redeploy:
//   Cors__AllowedOrigins__0=https://ascension.vercel.app
// AllowCredentials means origins must be listed exactly — no wildcards.
var corsOrigins = new List<string> { "http://localhost:5173" };
corsOrigins.AddRange(
    builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? []);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AscensionPolicy", policy =>
    {
        policy
            .WithOrigins([.. corsOrigins])
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ── JWT Authentication ────────────────────────────────────
var jwtSecret = builder.Configuration["JwtSettings:Secret"]!;
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"]!;
var jwtAudience = builder.Configuration["JwtSettings:Audience"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition =
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddOpenApi();
builder.Services.AddScoped<QuestService>();
builder.Services.AddSignalR();

// ── Rate limiting ─────────────────────────────────────────
// A *global* limiter, not a named policy: a named policy only applies to
// endpoints that opt in with [EnableRateLimiting], so a policy nobody
// references silently protects nothing. GlobalLimiter runs on every request.
//
// Partitioned by client IP (via X-Forwarded-For, populated by UseForwardedHeaders
// above) so one abusive client cannot exhaust the budget for everyone else.
// SignalR is exempt — a long-lived WebSocket connection and its negotiate
// handshake would otherwise burn through the window on reconnect storms.
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        if (httpContext.Request.Path.StartsWithSegments("/hubs"))
            return RateLimitPartition.GetNoLimiter("signalr");

        var clientKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(clientKey, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 5
            });
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Tell the client when it is worth retrying instead of letting it hammer.
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.Headers.RetryAfter = "60";
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Too many requests. Try again in a minute." },
            cancellationToken);
    };
});

// ── Build the app ─────────────────────────────────────────
var app = builder.Build();

// Must run before anything that reads the scheme or the client IP.
app.UseForwardedHeaders();

// Scalar is mapped in every environment, not just Development. The assessment
// requires the API documentation UI to be reachable, and a marker will be
// hitting the deployed Render instance where ASPNETCORE_ENVIRONMENT=Production.
// The API is read-only documentation over endpoints that already require a JWT,
// so exposing the schema costs nothing.
app.MapOpenApi();
app.MapScalarApiReference();

// Render already redirects HTTP to HTTPS at its edge, and the app itself only
// ever listens on plain HTTP there — redirecting again would just loop.
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("AscensionPolicy");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Render's health check path — also a quick way to confirm a deploy is live.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();