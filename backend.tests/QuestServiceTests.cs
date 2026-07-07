using Ascension.Api.Data;
using Ascension.Api.Models;
using Ascension.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace Ascension.Tests;

public class QuestServiceTests
{
    private AscensionDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AscensionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AscensionDbContext(options);
    }

    private Player CreateTestPlayer(string focus = FocusType.Bulking)
    {
        return new Player
        {
            Id = Guid.NewGuid().ToString(),
            UserName = "TestHunter",
            Goal = new Goal
            {
                Focus = focus,
                DaysPerWeek = 4,
                Equipment = "full gym"
            },
            StatBlock = new StatBlock()
        };
    }

    [Fact]
    public async Task GenerateQuestForToday_WhenNoQuestExists_CreatesQuest()
    {
        // Arrange
        var db = CreateDb();
        var player = CreateTestPlayer();
        db.Users.Add(player);
        await db.SaveChangesAsync();

        var service = new QuestService(db);

        // Act
        var quest = await service.GetOrGenerateTodaysQuestAsync(player.Id);

        // Assert
        Assert.NotNull(quest);
        Assert.Equal("Pending", quest.Status);
        Assert.Equal(DateTime.UtcNow.Date, quest.AssignedDate.Date);
        Assert.True(quest.XPReward > 0);
    }

    [Fact]
public async Task GetOrGenerateTodaysQuest_WhenQuestAlreadyExists_ReturnsSameQuest()
{
    // Arrange
    var db = CreateDb();
    var player = CreateTestPlayer();
    db.Users.Add(player);

    // Manually insert a quest for today
    var existingQuest = new Quest
    {
        Id = Guid.NewGuid(),
        PlayerId = player.Id,
        Description = "Existing quest",
        Type = "STR",
        Status = "Pending",
        XPReward = 100,
        StatReward = 3,
        AssignedDate = DateTime.UtcNow.Date,
        DueDate = DateTime.UtcNow.Date.AddDays(1),
        IsWeeklyGate = false
    };
    db.Quests.Add(existingQuest);
    await db.SaveChangesAsync();

    var service = new QuestService(db);

    // Act
    var quest = await service.GetOrGenerateTodaysQuestAsync(player.Id);

    // Assert — should return the existing one, not create a new one
    Assert.Equal(existingQuest.Id, quest.Id);
    Assert.Single(db.Quests); // still only one quest in the database
}

[Fact]
public async Task GenerateQuest_ForMainGain_GivesHigherXPThanOtherFocuses()
{
    // Arrange
    var db1 = CreateDb();
    var db2 = CreateDb();

    var bulkingPlayer = CreateTestPlayer(FocusType.Bulking);
    var mainGainPlayer = CreateTestPlayer(FocusType.MainGain);

    db1.Users.Add(bulkingPlayer);
    db2.Users.Add(mainGainPlayer);
    await db1.SaveChangesAsync();
    await db2.SaveChangesAsync();

    var bulkingService = new QuestService(db1);
    var mainGainService = new QuestService(db2);

    // Act
    var bulkingQuest = await bulkingService.GetOrGenerateTodaysQuestAsync(bulkingPlayer.Id);
    var mainGainQuest = await mainGainService.GetOrGenerateTodaysQuestAsync(mainGainPlayer.Id);

    // Assert — MainGain should always reward more XP
    Assert.True(mainGainQuest.XPReward > bulkingQuest.XPReward);
}

[Fact]
public async Task GenerateQuest_ForCutting_TypeIsAGIOrVIT()
{
    // Arrange
    var db = CreateDb();
    var player = CreateTestPlayer(FocusType.Cutting);
    db.Users.Add(player);
    await db.SaveChangesAsync();

    var service = new QuestService(db);

    // Act
    var quest = await service.GetOrGenerateTodaysQuestAsync(player.Id);

    // Assert — cutting quests should train AGI or VIT, not STR
    Assert.Contains(quest.Type, new[] { "AGI", "VIT" });
}
}

