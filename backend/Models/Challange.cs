using Ascension.Api.Models;

namespace Ascension.Api.Models;

public class Challenge
{
    public Guid Id { get; set; }
    public string ChallengerId { get; set; } = string.Empty;
    public string OpponentId { get; set; } = string.Empty;

    public string QuestDescription { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public string? WinnerId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ResolvesBy { get; set; }

    // Two explicit navigation properties — one per FK
    public Player? Challenger { get; set; }
    public Player? Opponent { get; set; }
    public Player? Winner { get; set; }

    public ICollection<ChallengeStake> Stakes { get; set; } = new List<ChallengeStake>();
}