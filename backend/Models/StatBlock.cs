using Ascension.Api.Models;

namespace Ascension.Api.Models;

public class StatBlock
{
    public Guid Id { get; set; }
    public string PlayerId { get; set; } = string.Empty;

    public int STR { get; set; } = 5;
    public int AGI { get; set; } = 5;
    public int VIT { get; set; } = 5;
    public int INT { get; set; } = 5;

    // Navigation property back to Player
    public Player? Player { get; set; }
}