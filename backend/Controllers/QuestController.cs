using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Ascension.Api.Services;
using System.Security.Claims;

namespace Ascension.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // every endpoint in this controller requires a valid JWT
public class QuestsController : ControllerBase
{
    private readonly QuestService _questService;

    public QuestsController(QuestService questService)
    {
        _questService = questService;
    }

    // Helper — reads the player's ID out of their JWT token
    // Remember: the token has claims baked in, including the player ID
    // So we never need to pass the ID in the URL — we read it from the token
    private string? GetPlayerId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    // GET /api/quests/today
    [HttpGet("today")]
    public async Task<IActionResult> GetTodaysQuest()
    {
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();

        var quest = await _questService.GetOrGenerateTodaysQuestAsync(playerId);
        return Ok(quest);
    }

    // GET /api/quests/weekly-gate
    [HttpGet("weekly-gate")]
    public async Task<IActionResult> GetWeeklyGate()
    {
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();

        var today = DateTime.UtcNow.Date;

        // Find this week's Monday
        var daysUntilMonday = ((int)DayOfWeek.Monday - (int)today.DayOfWeek + 7) % 7;
        var monday = daysUntilMonday == 0 ? today : today.AddDays(daysUntilMonday);

        var gate = await _questService.GetOrGenerateWeeklyGateAsync(playerId, monday);

        if (gate == null)
            return Ok(new { message = "Weekly Gate will appear on Monday" });

        return Ok(gate);
    }

    // POST /api/quests/{id}/complete
    [HttpPost("{id}/complete")]
    public async Task<IActionResult> CompleteQuest(Guid id)
    {
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();

        await _questService.CompleteQuestAsync(id, playerId);
        return Ok(new { message = "Quest completed. XP awarded." });
    }
}