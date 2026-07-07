using Ascension.Api.Data;
using Ascension.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Ascension.Api.Services;

public class QuestService
{
    private readonly AscensionDbContext _context;

    public QuestService(AscensionDbContext context)
    {
        _context = context;
    }

    public async Task<Quest> GetOrGenerateTodaysQuestAsync(string playerId)
    {
        // Check if a quest already exists for today
        var today = DateTime.UtcNow.Date;
        var existingQuest = await _context.Quests
            .FirstOrDefaultAsync(q => q.PlayerId == playerId
                && q.AssignedDate.Date == today
                && !q.IsWeeklyGate);

        if (existingQuest != null)
            return existingQuest;

        // Load the player's goal so we know their focus
        var goal = await _context.Goals
            .FirstOrDefaultAsync(g => g.PlayerId == playerId);

        var focus = goal?.Focus ?? FocusType.Bulking;

        // Generate a quest based on focus
        var quest = GenerateQuest(playerId, focus, today);

        _context.Quests.Add(quest);
        await _context.SaveChangesAsync();

        return quest;
    }

    private Quest GenerateQuest(string playerId, string focus, DateTime date)
    {
        var (description, type, xpReward, statReward) = focus switch
        {
            FocusType.Bulking => PickBulkingQuest(),
            FocusType.Cutting => PickCuttingQuest(),
            FocusType.Maintain => PickMaintainQuest(),
            FocusType.MainGain => PickMainGainQuest(),
            _ => PickBulkingQuest()
        };

        return new Quest
        {
            Id = Guid.NewGuid(),
            PlayerId = playerId,
            Description = description,
            Type = type,
            XPReward = xpReward,
            StatReward = statReward,
            Status = "Pending",
            AssignedDate = date,
            DueDate = date.AddDays(1),
            IsWeeklyGate = false
        };
    }

    // ── Quest template pools ──────────────────────────────
    // Each pool returns (description, statType, xpReward, statReward)
    // We pick randomly from a list so quests feel varied day to day

    private (string, string, int, int) PickBulkingQuest()
    {
        var quests = new[]
        {
            ("Complete a heavy push session: 4 sets of bench press", "STR", 120, 3),
            ("Hit a new squat PR or match your best for 3 sets", "STR", 150, 4),
            ("5 sets of deadlifts — rest 3 minutes between sets", "STR", 140, 4),
            ("Complete a pull session: rows, pull-ups, lat pulldowns", "STR", 120, 3),
            ("Overhead press + dips: 4 sets each", "STR", 110, 3),
        };
        return Pick(quests);
    }

    private (string, string, int, int) PickCuttingQuest()
    {
        var quests = new[]
        {
            ("30 min cardio + full body resistance circuit", "AGI", 110, 3),
            ("HIIT session: 10 rounds of 40s work, 20s rest", "AGI", 130, 4),
            ("5km run followed by core work", "AGI", 120, 3),
            ("Resistance training with short rest periods (60s max)", "AGI", 100, 3),
            ("Incline walk 45 mins + bodyweight circuit", "VIT", 100, 3),
        };
        return Pick(quests);
    }

    private (string, string, int, int) PickMaintainQuest()
    {
        var quests = new[]
        {
            ("Full body workout — moderate weight, moderate volume", "VIT", 100, 3),
            ("3 sets each: squat, press, row — no need to push limits", "VIT", 100, 3),
            ("20 min cardio + compound lifting session", "VIT", 100, 3),
            ("Mobility work + one compound lift of your choice", "VIT", 90, 2),
            ("Active recovery: light walk, stretching, foam rolling", "VIT", 80, 2),
        };
        return Pick(quests);
    }

    private (string, string, int, int) PickMainGainQuest()
    {
        // Harder mode — higher XP to reflect the difficulty
        var quests = new[]
        {
            ("Heavy compound lift + 20 min conditioning finisher", "STR", 180, 5),
            ("Push/pull superset session + 3km run", "STR", 175, 5),
            ("Strength work first, then HIIT: no skipping either half", "AGI", 170, 5),
            ("5 sets squats + 5 sets Romanian deadlift + 15 min cardio", "STR", 185, 5),
            ("Upper body strength + 30 min steady state cardio", "STR", 165, 4),
        };
        return Pick(quests);
    }

    private static (string, string, int, int) Pick((string, string, int, int)[] options)
    {
        var index = Random.Shared.Next(options.Length);
        return options[index];
    }
}

