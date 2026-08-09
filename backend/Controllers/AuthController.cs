using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Ascension.Api.Data;
using Ascension.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Ascension.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<Player> _userManager;
    private readonly IConfiguration _configuration;
    private readonly AscensionDbContext _context;

    public AuthController(
        UserManager<Player> userManager,
        IConfiguration configuration,
        AscensionDbContext context)
    {
        _userManager = userManager;
        _configuration = configuration;
        _context = context;
    }

    // ── POST /api/auth/register ───────────────────────────
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        // Create a new Player — Identity fills in the password hash
        var player = new Player
        {
            UserName = dto.Username,
            Email = dto.Email,
        };

        var result = await _userManager.CreateAsync(player, dto.Password);

        if (!result.Succeeded)
        {
            // Return exactly what Identity says went wrong
            // e.g. "password too short", "username taken"
            return BadRequest(result.Errors);
        }

        // Give the new player a StatBlock and a starting Goal
        // so the rest of the app always has something to read
        var statBlock = new StatBlock { PlayerId = player.Id };
        var goal = new Goal
        {
            PlayerId = player.Id,
            // Must be a real FocusType — the quest engine switches on this value,
            // and an unrecognised string silently falls through to Bulking.
            Focus = FocusType.IsValid(dto.Focus ?? "") ? dto.Focus! : FocusType.Bulking,
            DaysPerWeek = dto.DaysPerWeek > 0 ? dto.DaysPerWeek : 3,
            Equipment = dto.Equipment ?? "full gym"
        };

        _context.StatBlocks.Add(statBlock);
        _context.Goals.Add(goal);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Player registered successfully" });
    }

    // ── POST /api/auth/login ──────────────────────────────
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        // Find the player by username
        var player = await _userManager.FindByNameAsync(dto.Username);
        if (player == null)
            return Unauthorized(new { message = "Invalid username or password" });

        // Check the password — Identity handles the hash comparison
        var passwordValid = await _userManager.CheckPasswordAsync(player, dto.Password);
        if (!passwordValid)
            return Unauthorized(new { message = "Invalid username or password" });

        // Build the JWT token
        var token = GenerateJwtToken(player);

        return Ok(new
        {
            token,
            playerId = player.Id,
            username = player.UserName,
            level = player.Level,
            rank = player.Rank
        });
    }

    // ── JWT generation ────────────────────────────────────
    private string GenerateJwtToken(Player player)
    {
        var secret = _configuration["JwtSettings:Secret"]!;
        var issuer = _configuration["JwtSettings:Issuer"]!;
        var audience = _configuration["JwtSettings:Audience"]!;

        // Claims are pieces of information baked into the token
        // The frontend can read these without hitting the database
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, player.Id),
            new Claim(JwtRegisteredClaimNames.UniqueName, player.UserName!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7), // token lasts 7 days
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// ── DTOs ──────────────────────────────────────────────────
public class RegisterDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Focus { get; set; }
    public int DaysPerWeek { get; set; }
    public string? Equipment { get; set; }
}

public class LoginDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}