using Ascension.Api.Models;

using Microsoft.AspNetCore.Identity;

namespace Ascension.Api.Models;
public class Player : IdentityUser
{
    public int Level { get; set; } = 1;
    public int CurrentXP { get; set; } = 0;
    public string Rank { get; set; } = "E";
    public int CurrentStreak { get; set; } = 0;
    public int DayOffTokens { get; set; } = 0;

    // Navigation properties — EF Core uses these to understand relationships
    public StatBlock? StatBlock { get; set; }
    public Goal? Goal { get; set; }
    public ICollection<Quest> Quests { get; set; } = new List<Quest>();
    public ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();
    public ICollection<PlayerAchievement> PlayerAchievements { get; set; } = new List<PlayerAchievement>();
    public ICollection<Challenge> ChallengesAsChallenger { get; set; } = new List<Challenge>();
    public ICollection<Challenge> ChallengesAsOpponent { get; set; } = new List<Challenge>();
}