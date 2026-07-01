using Ascension.Api.Models;

namespace Ascension.Api.Models;

public class PlayerAchievement
{
    public Guid Id { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    public Guid AchievementId { get; set; }
    public DateTime UnlockedAt { get; set; }

    public Player? Player { get; set; }
    public Achievement? Achievement { get; set; }
}