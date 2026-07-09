using Scalar.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Ascension.Api.Data;
using Ascension.Api.Models;
using System.Text;
using Ascension.Api.Services;


var builder = WebApplication.CreateBuilder(args);

// ── Database ─────────────────────────────────────────────
builder.Services.AddDbContext<AscensionDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ── Identity ─────────────────────────────────────────────
// Wires up the user account system using our Player class
// and stores everything in our existing AscensionDbContext
builder.Services.AddIdentity<Player, IdentityRole>(options =>
{
    // Password rules — relaxed slightly for a game app
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
})
.AddEntityFrameworkStores<AscensionDbContext>()
.AddDefaultTokenProviders();

// ── CORS ──────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AscensionPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "https://your-azure-static-app.azurestaticapps.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ── JWT Authentication ────────────────────────────────────
// Pulls the JWT settings from user-secrets
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
        ValidateLifetime = true,        // tokens expire
        ValidateIssuerSigningKey = true, // signature must match our secret
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
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

// ── Build the app ─────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}
app.UseHttpsRedirection();
app.UseCors("AscensionPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();