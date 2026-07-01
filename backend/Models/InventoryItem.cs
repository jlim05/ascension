using Ascension.Api.Models;

namespace Ascension.Api.Models;

public class InventoryItem
{
    public Guid Id { get; set; }
    public string PlayerId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Rarity { get; set; } = "Common";
    public string IconKey { get; set; } = string.Empty;

    public Player? Player { get; set; }
    public ICollection<ChallengeStake> ChallengeStakes { get; set; } = new List<ChallengeStake>();
}