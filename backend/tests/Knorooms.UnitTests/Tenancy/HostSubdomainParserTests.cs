using Knorooms.SharedKernel.Tenancy;

namespace Knorooms.UnitTests.Tenancy;

public sealed class HostSubdomainParserTests
{
    [Theory]
    [InlineData("localhost:3000", "localhost", TenantHostKind.Public, null)]
    [InlineData("www.localhost:3000", "localhost", TenantHostKind.Public, null)]
    [InlineData("knorooms.com", "knorooms.com", TenantHostKind.Public, null)]
    [InlineData("www.knorooms.com", "knorooms.com", TenantHostKind.Public, null)]
    [InlineData("admin.localhost:3000", "localhost", TenantHostKind.Platform, null)]
    [InlineData("admin.knorooms.com", "knorooms.com", TenantHostKind.Platform, null)]
    [InlineData("colegio-a.localhost:3000", "localhost", TenantHostKind.Institution, "colegio-a")]
    [InlineData("colegio-duarte.knorooms.com", "knorooms.com", TenantHostKind.Institution, "colegio-duarte")]
    public void Resolve_ValidHosts_ReturnsExpectedHostKindAndSlug(
        string rawHost,
        string baseDomain,
        TenantHostKind expectedKind,
        string? expectedSlug)
    {
        var result = HostSubdomainParser.Resolve(rawHost, baseDomain, "admin");

        Assert.True(result.IsValid);
        Assert.Equal(expectedKind, result.HostKind);
        Assert.Equal(expectedSlug, result.TenantSlug);
    }

    [Theory]
    [InlineData("", "localhost")]
    [InlineData("api.knorooms.com", "knorooms.com")]
    [InlineData("auth.knorooms.com", "knorooms.com")]
    [InlineData("support.knorooms.com", "knorooms.com")]
    [InlineData("sub.colegio-a.knorooms.com", "knorooms.com")]
    [InlineData("-invalid.knorooms.com", "knorooms.com")]
    [InlineData("evil.example.com", "knorooms.com")]
    public void Resolve_InvalidOrReservedHosts_ReturnsInvalidResult(string rawHost, string baseDomain)
    {
        var result = HostSubdomainParser.Resolve(rawHost, baseDomain, "admin");

        Assert.False(result.IsValid);
        Assert.Null(result.TenantSlug);
    }
}
