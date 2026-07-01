using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Ascension.Api.Models; // ADD THIS LINE

namespace Ascension.Api.Data;

public class AscensionDbContext : IdentityDbContext<Player>
{
    public AscensionDbContext(DbContextOptions<AscensionDbContext> options)
        : base(options)
    {
    }

    public DbSet<StatBlock> StatBlocks => Set<StatBlock>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<Quest> Quests => Set<Quest>();
    public DbSet<Achievement> Achievements => Set<Achievement>();
    public DbSet<PlayerAchievement> PlayerAchievements => Set<PlayerAchievement>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<Challenge> Challenges => Set<Challenge>();
    public DbSet<ChallengeStake> ChallengeStakes => Set<ChallengeStake>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Challenge>()
            .HasOne(c => c.Challenger)
            .WithMany(p => p.ChallengesAsChallenger)
            .HasForeignKey(c => c.ChallengerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Challenge>()
            .HasOne(c => c.Opponent)
            .WithMany(p => p.ChallengesAsOpponent)
            .HasForeignKey(c => c.OpponentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Challenge>()
            .HasOne(c => c.Winner)
            .WithMany()
            .HasForeignKey(c => c.WinnerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}