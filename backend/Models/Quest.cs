using Ascension.Api.Models;

namespace Ascension.Api.Models;

public class Quest
{
    public Guid Id { get; set; }
    public string PlayerId { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int XPReward { get; set; }
    public int StatReward { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime AssignedDate { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsWeeklyGate { get; set; } = false;

    public Player? Player { get; set; }
}