using Ascension.Api.Controllers;
using Ascension.Api.Data;
using Ascension.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Ascension.Tests;

/// <summary>
/// Covers the four CRUD operations on a player's Goal, plus the ownership
/// boundary — a player must only ever see and mutate their own goal.
/// </summary>
public class GoalsControllerTests
{
    private const string PlayerId = "player-1";
    private const string OtherPlayerId = "player-2";

    private static AscensionDbContext CreateDb() =>
        new(new DbContextOptionsBuilder<AscensionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options);

    // Builds a controller whose JWT identity is the given player, mirroring what
    // the JwtBearer middleware puts on HttpContext.User at runtime.
    private static GoalsController CreateController(AscensionDbContext db, string playerId)
    {
        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, playerId)], "TestAuth");

        return new GoalsController(db)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(identity)
                }
            }
        };
    }

    private static Goal SeedGoal(AscensionDbContext db, string playerId, string focus = FocusType.Bulking)
    {
        var goal = new Goal
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            Focus = focus,
            DaysPerWeek = 4,
            Equipment = "full gym"
        };
        db.Goals.Add(goal);
        db.SaveChanges();
        return goal;
    }

    // ── CREATE ────────────────────────────────────────────

    [Fact]
    public async Task Create_WhenNoGoalExists_PersistsGoalForTheAuthenticatedPlayer()
    {
        var db = CreateDb();
        var controller = CreateController(db, PlayerId);

        var result = await controller.Create(new GoalDto
        {
            Focus = FocusType.Cutting,
            DaysPerWeek = 5,
            Equipment = "home gym"
        });

        Assert.IsType<CreatedAtActionResult>(result);

        var saved = await db.Goals.SingleAsync();
        Assert.Equal(PlayerId, saved.PlayerId);
        Assert.Equal(FocusType.Cutting, saved.Focus);
        Assert.Equal(5, saved.DaysPerWeek);
    }

    [Fact]
    public async Task Create_WhenGoalAlreadyExists_ReturnsConflictAndDoesNotDuplicate()
    {
        var db = CreateDb();
        SeedGoal(db, PlayerId);
        var controller = CreateController(db, PlayerId);

        var result = await controller.Create(new GoalDto
        {
            Focus = FocusType.MainGain,
            DaysPerWeek = 6,
            Equipment = "full gym"
        });

        Assert.IsType<ConflictObjectResult>(result);
        Assert.Single(db.Goals);
    }

    [Fact]
    public async Task Create_WithUnrecognisedFocus_ReturnsBadRequest()
    {
        var db = CreateDb();
        var controller = CreateController(db, PlayerId);

        // "strength" is not a FocusType — the quest engine would silently fall
        // back to Bulking, so it is rejected at the boundary instead.
        var result = await controller.Create(new GoalDto
        {
            Focus = "strength",
            DaysPerWeek = 3,
            Equipment = "full gym"
        });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(db.Goals);
    }

    // ── READ ──────────────────────────────────────────────

    [Fact]
    public async Task Get_ReturnsOnlyTheAuthenticatedPlayersGoal()
    {
        var db = CreateDb();
        SeedGoal(db, PlayerId, FocusType.Maintain);
        SeedGoal(db, OtherPlayerId, FocusType.MainGain);

        var controller = CreateController(db, PlayerId);
        var result = await controller.Get();

        var ok = Assert.IsType<OkObjectResult>(result);
        var focus = ok.Value!.GetType().GetProperty("focus")!.GetValue(ok.Value);
        Assert.Equal(FocusType.Maintain, focus);
    }

    [Fact]
    public async Task Get_WhenPlayerHasNoGoal_ReturnsNotFound()
    {
        var db = CreateDb();
        SeedGoal(db, OtherPlayerId);

        var controller = CreateController(db, PlayerId);
        var result = await controller.Get();

        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ── UPDATE ────────────────────────────────────────────

    [Fact]
    public async Task Update_ChangesEveryEditableFieldOnTheExistingGoal()
    {
        var db = CreateDb();
        var goal = SeedGoal(db, PlayerId, FocusType.Bulking);
        var controller = CreateController(db, PlayerId);

        var result = await controller.Update(new GoalDto
        {
            Focus = FocusType.Cutting,
            DaysPerWeek = 6,
            Equipment = "dumbbells only"
        });

        Assert.IsType<OkObjectResult>(result);

        var updated = await db.Goals.SingleAsync();
        Assert.Equal(goal.Id, updated.Id); // updated in place, not replaced
        Assert.Equal(FocusType.Cutting, updated.Focus);
        Assert.Equal(6, updated.DaysPerWeek);
        Assert.Equal("dumbbells only", updated.Equipment);
    }

    [Fact]
    public async Task Update_CannotReachAnotherPlayersGoal()
    {
        var db = CreateDb();
        SeedGoal(db, OtherPlayerId, FocusType.Bulking);

        // PlayerId has no goal of their own, only player-2 does.
        var controller = CreateController(db, PlayerId);
        var result = await controller.Update(new GoalDto
        {
            Focus = FocusType.MainGain,
            DaysPerWeek = 7,
            Equipment = "full gym"
        });

        Assert.IsType<NotFoundObjectResult>(result);

        var untouched = await db.Goals.SingleAsync();
        Assert.Equal(FocusType.Bulking, untouched.Focus);
    }

    // ── DELETE ────────────────────────────────────────────

    [Fact]
    public async Task Delete_RemovesTheGoalAndReturnsNoContent()
    {
        var db = CreateDb();
        SeedGoal(db, PlayerId);
        var controller = CreateController(db, PlayerId);

        var result = await controller.Delete();

        Assert.IsType<NoContentResult>(result);
        Assert.Empty(db.Goals);
    }

    [Fact]
    public async Task Delete_LeavesOtherPlayersGoalsIntact()
    {
        var db = CreateDb();
        SeedGoal(db, PlayerId);
        SeedGoal(db, OtherPlayerId);

        var controller = CreateController(db, PlayerId);
        await controller.Delete();

        var remaining = await db.Goals.SingleAsync();
        Assert.Equal(OtherPlayerId, remaining.PlayerId);
    }

    [Fact]
    public async Task Delete_WhenNothingToDelete_ReturnsNotFound()
    {
        var db = CreateDb();
        var controller = CreateController(db, PlayerId);

        var result = await controller.Delete();

        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ── Full round trip ───────────────────────────────────

    [Fact]
    public async Task CreateReadUpdateDelete_FullLifecycleWorksEndToEnd()
    {
        var db = CreateDb();
        var controller = CreateController(db, PlayerId);

        await controller.Create(new GoalDto
        {
            Focus = FocusType.Bulking,
            DaysPerWeek = 3,
            Equipment = "full gym"
        });
        Assert.IsType<OkObjectResult>(await controller.Get());

        await controller.Update(new GoalDto
        {
            Focus = FocusType.MainGain,
            DaysPerWeek = 5,
            Equipment = "full gym"
        });
        Assert.Equal(FocusType.MainGain, (await db.Goals.SingleAsync()).Focus);

        await controller.Delete();
        Assert.IsType<NotFoundObjectResult>(await controller.Get());
    }
}
