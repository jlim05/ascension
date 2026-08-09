using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Ascension.Api.Data;
using Ascension.Api.Models;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace Ascension.Api.Controllers;

/// <summary>
/// Full CRUD for a player's training Goal — the record that drives quest
/// generation. A player has exactly one Goal, so the resource is addressed as
/// /api/goals rather than /api/goals/{id}: the owning player is read from the
/// JWT, which also means a player can never touch another player's goal.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GoalsController : ControllerBase
{
    private readonly AscensionDbContext _context;

    public GoalsController(AscensionDbContext context)
    {
        _context = context;
    }

    private string? GetPlayerId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    // ── CREATE ────────────────────────────────────────────
    // POST /api/goals
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] GoalDto dto)
    {
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();

        // One goal per player — creating a second would leave quest generation
        // with an ambiguous focus, so ask the caller to PUT instead.
        var existing = await _context.Goals
            .FirstOrDefaultAsync(g => g.PlayerId == playerId);

        if (existing != null)
            return Conflict(new { message = "A goal already exists. Use PUT /api/goals to update it." });

        if (!FocusType.IsValid(dto.Focus))
            return BadRequest(new { message = $"Focus must be one of: {string.Join(", ", FocusType.All)}" });

        var goal = new Goal
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            Focus = dto.Focus.Trim(),
            DaysPerWeek = dto.DaysPerWeek,
            Equipment = dto.Equipment.Trim()
        };

        _context.Goals.Add(goal);
        await _context.SaveChangesAsync();

        // Two-arg overload deliberately: passing a literal null as the middle
        // argument is ambiguous between the routeValues and controllerName
        // overloads and will not compile.
        return CreatedAtAction(nameof(Get), ToResponse(goal));
    }

    // ── READ ──────────────────────────────────────────────
    // GET /api/goals
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Get()
    {
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();

        var goal = await _context.Goals
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.PlayerId == playerId);

        if (goal == null)
            return NotFound(new { message = "No goal set. Create one with POST /api/goals." });

        return Ok(ToResponse(goal));
    }

    // ── UPDATE ────────────────────────────────────────────
    // PUT /api/goals
    [HttpPut]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update([FromBody] GoalDto dto)
    {
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();

        var goal = await _context.Goals
            .FirstOrDefaultAsync(g => g.PlayerId == playerId);

        if (goal == null)
            return NotFound(new { message = "No goal to update. Create one with POST /api/goals." });

        if (!FocusType.IsValid(dto.Focus))
            return BadRequest(new { message = $"Focus must be one of: {string.Join(", ", FocusType.All)}" });

        goal.Focus = dto.Focus.Trim();
        goal.DaysPerWeek = dto.DaysPerWeek;
        goal.Equipment = dto.Equipment.Trim();

        await _context.SaveChangesAsync();

        return Ok(ToResponse(goal));
    }

    // ── DELETE ────────────────────────────────────────────
    // DELETE /api/goals
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete()
    {
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();

        var goal = await _context.Goals
            .FirstOrDefaultAsync(g => g.PlayerId == playerId);

        if (goal == null)
            return NotFound(new { message = "No goal to delete." });

        _context.Goals.Remove(goal);
        await _context.SaveChangesAsync();

        // Quest generation falls back to the Bulking focus when no goal exists,
        // so deleting a goal degrades the experience rather than breaking it.
        return NoContent();
    }

    // Entities are never returned directly — a response shape keeps PlayerId
    // and EF navigation properties out of the payload.
    private static object ToResponse(Goal goal) => new
    {
        id = goal.Id,
        focus = goal.Focus,
        daysPerWeek = goal.DaysPerWeek,
        equipment = goal.Equipment
    };
}

// ── DTO ───────────────────────────────────────────────────
// Bound and validated before it reaches the database. Because the client sends
// a DTO rather than a Goal entity, it cannot set PlayerId and reassign someone
// else's goal to itself.
public class GoalDto
{
    [Required]
    [StringLength(30, MinimumLength = 3)]
    public string Focus { get; set; } = string.Empty;

    [Range(1, 7, ErrorMessage = "DaysPerWeek must be between 1 and 7.")]
    public int DaysPerWeek { get; set; }

    [Required]
    [StringLength(60, MinimumLength = 2)]
    public string Equipment { get; set; } = string.Empty;
}
