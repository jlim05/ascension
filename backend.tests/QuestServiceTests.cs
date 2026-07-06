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
}