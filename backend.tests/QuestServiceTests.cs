using Ascension.Api.Data;
using Ascension.Api.Models;
using Ascension.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Ascension.Api.Hubs;
using Moq;

namespace Ascension.Tests;

public class QuestServiceTests
{
    private IHubContext<NotificationHub> CreateFakeHubContext()
    {
        var mockClients = new Mock<IHubClients>();
        var mockClientProxy = new Mock<IClientProxy>();
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockClientProxy.Object);
        var mockHub = new Mock<IHubContext<NotificationHub>>();
        mockHub.Setup(h => h.Clients).Returns(mockClients.Object);
        return mockHub.Object;
    }
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

        var service = new QuestService(db, CreateFakeHubContext());

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

        var service = new QuestService(db, CreateFakeHubContext());

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

        var bulkingService = new QuestService(db1, CreateFakeHubContext());
        var mainGainService = new QuestService(db2, CreateFakeHubContext());

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

        var service = new QuestService(db, CreateFakeHubContext());

        // Act
        var quest = await service.GetOrGenerateTodaysQuestAsync(player.Id);

        // Assert — cutting quests should train AGI or VIT, not STR
        Assert.Contains(quest.Type, new[] { "AGI", "VIT" });
    }

[Fact]
    public async Task CompleteQuest_IncreasesStreakAndAwardsXP()
    {
        // Arrange
        var db = CreateDb();
        var player = CreateTestPlayer();
        player.CurrentStreak = 0;
        player.CurrentXP = 0;
        db.Users.Add(player);

        var quest = new Quest
        {
            Id = Guid.NewGuid(),
            PlayerId = player.Id,
            Description = "Test quest",
            Type = "STR",
            Status = "Pending",
            XPReward = 100,
            StatReward = 3,
            AssignedDate = DateTime.UtcNow.Date,
            DueDate = DateTime.UtcNow.Date.AddDays(1),
            IsWeeklyGate = false
        };
        db.Quests.Add(quest);
        await db.SaveChangesAsync();

        var service = new QuestService(db, CreateFakeHubContext());

        // Act
        await service.CompleteQuestAsync(quest.Id, player.Id);

        // Assert
        var updatedPlayer = await db.Users.FindAsync(player.Id);
        Assert.Equal(1, updatedPlayer!.CurrentStreak);
        Assert.Equal(100, updatedPlayer.CurrentXP);
    }

    [Fact]
    public async Task FailedQuest_ResetsStreakAndDeductsStats()
    {
        // Arrange
        var db = CreateDb();
        var player = CreateTestPlayer();
        player.CurrentStreak = 3;
        db.Users.Add(player);

        var statBlock = new StatBlock
        {
            PlayerId = player.Id,
            STR = 10,
            AGI = 10,
            VIT = 10,
            INT = 10
        };
        db.StatBlocks.Add(statBlock);

        var yesterdayQuest = new Quest
        {
            Id = Guid.NewGuid(),
            PlayerId = player.Id,
            Description = "Yesterday's quest",
            Type = "STR",
            Status = "Pending",
            XPReward = 100,
            StatReward = 3,
            AssignedDate = DateTime.UtcNow.Date.AddDays(-1),
            DueDate = DateTime.UtcNow.Date,
            IsWeeklyGate = false
        };
        db.Quests.Add(yesterdayQuest);
        await db.SaveChangesAsync();

        var service = new QuestService(db, CreateFakeHubContext());

        // Act — getting today's quest should trigger the penalty check
        await service.GetOrGenerateTodaysQuestAsync(player.Id);

        // Assert
        var updatedPlayer = await db.Users.FindAsync(player.Id);
        var updatedQuest = await db.Quests.FindAsync(yesterdayQuest.Id);
        var updatedStats = await db.StatBlocks.FirstAsync(s => s.PlayerId == player.Id);

        Assert.Equal(0, updatedPlayer!.CurrentStreak);
        Assert.Equal("Failed", updatedQuest!.Status);
        Assert.True(updatedStats.STR < 10); // stat was deducted
    }

    [Fact]
    public async Task GenerateWeeklyGate_OnMonday_CreatesGateQuest()
    {
        // Arrange
        var db = CreateDb();
        var player = CreateTestPlayer();
        db.Users.Add(player);
        await db.SaveChangesAsync();

        var service = new QuestService(db, CreateFakeHubContext());

        // Find the next Monday from today (or use today if it's Monday)
        var today = DateTime.UtcNow.Date;
        var daysUntilMonday = ((int)DayOfWeek.Monday - (int)today.DayOfWeek + 7) % 7;
        var monday = today.AddDays(daysUntilMonday == 0 ? 0 : daysUntilMonday);

        // Act
        var gateQuest = await service.GetOrGenerateWeeklyGateAsync(player.Id, monday);

        // Assert
        Assert.NotNull(gateQuest);
        Assert.True(gateQuest.IsWeeklyGate);
        Assert.True(gateQuest.XPReward > 150); // gate gives more XP than daily
    }
}

