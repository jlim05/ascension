using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ascension.Api.Data;
using System.Security.Claims;

namespace Ascension.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlayersController : ControllerBase
{
    private readonly AscensionDbContext _context;

    public PlayersController(AscensionDbContext context)
    {
        _context = context;
    }

    private string? GetPlayerId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    // GET /api/players/me
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();

        var player = await _context.Users
            .Include(p => p.StatBlock)
            .Include(p => p.Goal)
            .Include(p => p.PlayerAchievements)
                .ThenInclude(pa => pa.Achievement)
            .FirstOrDefaultAsync(p => p.Id == playerId);

        if (player == null) return NotFound();

        return Ok(new
        {
            id = player.Id,
            username = player.UserName,
            level = player.Level,
            currentXP = player.CurrentXP,
            rank = player.Rank,
            currentStreak = player.CurrentStreak,
            dayOffTokens = player.DayOffTokens,
            stats = player.StatBlock == null ? null : new
            {
                str = player.StatBlock.STR,
                agi = player.StatBlock.AGI,
                vit = player.StatBlock.VIT,
                intel = player.StatBlock.INT
            },
            goal = player.Goal == null ? null : new
            {
                focus = player.Goal.Focus,
                daysPerWeek = player.Goal.DaysPerWeek,
                equipment = player.Goal.Equipment
            },
            achievements = player.PlayerAchievements.Select(pa => new
            {
                name = pa.Achievement!.Name,
                description = pa.Achievement.Description,
                unlockedAt = pa.UnlockedAt
            })
        });
    }

    // GET /api/players/leaderboard
    [HttpGet("leaderboard")]
    public async Task<IActionResult> GetLeaderboard()
    {
        var players = await _context.Users
            .Include(p => p.StatBlock)
            .OrderByDescending(p => p.Level)
            .ThenByDescending(p => p.CurrentXP)
            .Take(50) // top 50 players
            .Select(p => new
            {
                id = p.Id,
                username = p.UserName,
                level = p.Level,
                currentXP = p.CurrentXP,
                rank = p.Rank,
                str = p.StatBlock != null ? p.StatBlock.STR : 0,
                agi = p.StatBlock != null ? p.StatBlock.AGI : 0,
                vit = p.StatBlock != null ? p.StatBlock.VIT : 0
            })
            .ToListAsync();

        return Ok(players);
    }
}