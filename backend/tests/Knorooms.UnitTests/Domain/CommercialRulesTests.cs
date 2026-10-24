using Knorooms.Modules.Modules.Subscriptions.Contracts;
using Knorooms.Modules.Modules.Subscriptions.Domain;
using Knorooms.Modules.Modules.Entitlements.Contracts;
namespace Knorooms.UnitTests.Domain;

public sealed class CommercialRulesTests
{
    [Fact]
    public void Plan_RequiresDependencies_AndPositiveLimits()
    {
        var command = new CreatePlanCommand("pilot", "Piloto", "", 1, null, null, "Annual", 10, null, ["reportcards"]);
        Assert.True(PlanVersion.Create(command).IsFailure);
        Assert.True(PlanVersion.Create(command with { Modules = ["students", "academic", "enrollments", "grading", "reportcards"] }).IsSuccess);
        Assert.True(PlanVersion.Create(command with { Modules = [], MaxActiveStudents = 0 }).IsFailure);
    }
    [Theory]
    [InlineData("Expired")]
    [InlineData("Suspended")]
    [InlineData("Cancelled")]
    [InlineData("Unassigned")]
    [InlineData("Scheduled")]
    public void InactiveSubscription_PreservesRead_ButDeniesAllWrites(string status)
    {
        var access = ProductModuleCatalog.Resolve(ProductModuleCatalog.All.Select(x => x.Code), status);
        Assert.All(access, x => Assert.False(x.CanWrite));
        Assert.All(access.Where(x => x.Code != "moodle"), x => Assert.True(x.CanRead));
    }
    [Fact]
    public void DisabledDependency_BlocksDownstream_AndMoodleRemainsUnavailable()
    {
        var access = ProductModuleCatalog.Resolve(["students", "enrollments", "grading", "reportcards", "moodle"], "Active");
        Assert.True(access.Single(x => x.Code == "students").CanWrite);
        Assert.False(access.Single(x => x.Code == "reportcards").CanWrite);
        Assert.False(access.Single(x => x.Code == "moodle").CanWrite);
    }
    [Fact]
    public void Subscription_UsesExclusiveEnd_AndRejectsInvalidDates()
    {
        var now = DateTimeOffset.UtcNow; var sub = new InstitutionSubscription(Guid.NewGuid());
        var command = new AssignSubscriptionCommand(Guid.NewGuid(), now, now.AddDays(1), "Active", "Contrato", [], null);
        Assert.True(sub.Update(command).IsSuccess);
        Assert.Equal("Scheduled", sub.EffectiveStatus(now.AddSeconds(-1))); Assert.Equal("Active", sub.EffectiveStatus(now)); Assert.Equal("Expired", sub.EffectiveStatus(command.EndsAtUtc));
        Assert.True(sub.Update(command with { EndsAtUtc = now }).IsFailure);
    }
}
