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

        // Check if yesterday's quest was missed — apply penalty if so
        var yesterday = today.AddDays(-1);
        var missedQuest = await _context.Quests
            .FirstOrDefaultAsync(q => q.PlayerId == playerId
                && q.AssignedDate.Date == yesterday
                && q.Status == "Pending"
                && !q.IsWeeklyGate);

        if (missedQuest != null)
        {
            var player = await _context.Users
                .FirstOrDefaultAsync(p => p.Id == playerId);
            if (player != null)
                await ApplyPenaltyAsync(missedQuest, player);
        }

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
    public async Task CompleteQuestAsync(Guid questId, string playerId)
{
    var quest = await _context.Quests.FindAsync(questId);
    if (quest == null || quest.PlayerId != playerId) return;

    quest.Status = "Completed";

    var player = await _context.Users
        .Include(p => p.StatBlock)
        .FirstOrDefaultAsync(p => p.Id == playerId);

    if (player == null) return;

    // Award XP — apply 1.5x boost if streak is at 5
    var xpBoost = player.CurrentStreak >= 5 ? 1.5 : 1.0;
    player.CurrentXP += (int)(quest.XPReward * xpBoost);

    // Increase streak
    player.CurrentStreak += 1;

    // Award stat points based on quest type
    if (player.StatBlock != null)
        ApplyStatReward(player.StatBlock, quest.Type, quest.StatReward);

    // Check if player levels up (100 XP per level)
    CheckLevelUp(player);

    await _context.SaveChangesAsync();
}

    private async Task ApplyPenaltyAsync(Quest quest, Player player)
    {
        quest.Status = "Failed";
        player.CurrentStreak = 0;

        // Load stat block and deduct points — never go below 1
        var statBlock = await _context.StatBlocks
            .FirstOrDefaultAsync(s => s.PlayerId == player.Id);

        if (statBlock != null)
        {
            statBlock.STR = Math.Max(1, statBlock.STR - 2);
            statBlock.AGI = Math.Max(1, statBlock.AGI - 1);
            statBlock.VIT = Math.Max(1, statBlock.VIT - 1);
        }
    }

    private static void ApplyStatReward(StatBlock statBlock, string type, int amount)
    {
        switch (type)
        {
            case "STR": statBlock.STR += amount; break;
            case "AGI": statBlock.AGI += amount; break;
            case "VIT": statBlock.VIT += amount; break;
            case "INT": statBlock.INT += amount; break;
        }
    }

    private static void CheckLevelUp(Player player)
    {
        // Every 100 XP = 1 level. Rank gates every 10 levels.
        var newLevel = (player.CurrentXP / 100) + 1;
        if (newLevel > player.Level)
        {
            player.Level = newLevel;
            player.Rank = player.Level switch
            {
                < 10 => "E",
                < 20 => "D",
                < 30 => "C",
                < 40 => "B",
                < 50 => "A",
                _ => "S"
            };
        }
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

