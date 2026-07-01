using Ascension.Api.Models;

namespace Ascension.Api.Models;

public class ChallengeStake
{
    public Guid Id { get; set; }
    public Guid ChallengeId { get; set; }
    public string PlayerId { get; set; } = string.Empty;
    public Guid InventoryItemId { get; set; }

    public Challenge? Challenge { get; set; }
    public Player? Player { get; set; }
    public InventoryItem? InventoryItem { get; set; }
}