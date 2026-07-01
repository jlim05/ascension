using Ascension.Api.Models;

namespace Ascension.Api.Models;

public class Goal
{
    public Guid Id { get; set; }
    public string PlayerId { get; set; } = string.Empty;

    public string Focus { get; set; } = string.Empty;
    public int DaysPerWeek { get; set; }
    public string Equipment { get; set; } = string.Empty;

    public Player? Player { get; set; }
}