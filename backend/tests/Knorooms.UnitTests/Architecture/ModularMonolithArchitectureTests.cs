using Knorooms.Api.Controllers;
using Knorooms.Modules;
using Knorooms.SharedKernel.Domain;
using Microsoft.AspNetCore.Mvc;
using NetArchTest.Rules;

namespace Knorooms.UnitTests.Architecture;

public sealed class ModularMonolithArchitectureTests
{
    private static readonly string[] AllModules =
    [
        "Identity",
        "Tenants",
        "Platform",
        "Students",
        "Academic",
        "Enrollments",
        "Attendance",
        "Grading",
        "ReportCards",
        "Authorization",
        "SupportAccess",
        "Audit",
        "Subscriptions",
        "Entitlements"
    ];

    [Fact]
    public void Module_ApplicationAndInfrastructure_ShouldNotBePublic()
    {
        var assembly = typeof(ModulesDependencyInjection).Assembly;

        var result = Types.InAssembly(assembly)
            .That()
            .ResideInNamespaceMatching(@"^Knorooms\.Modules\.Modules\..*\.(Application|Infrastructure)$")
            .Should()
            .NotBePublic()
            .GetResult();

        Assert.True(
            result.IsSuccessful,
            $"Las implementaciones internas de Application/Infrastructure de cada módulo deben ser internal: {string.Join(", ", result.FailingTypeNames ?? [])}");
    }

    [Fact]
    public void Modules_ShouldNotReferenceOtherModulesInternalApplicationOrInfrastructure()
    {
        var assembly = typeof(ModulesDependencyInjection).Assembly;

        foreach (var module in AllModules)
        {
            var forbiddenNamespaces = AllModules
                .Where(other => !string.Equals(other, module, StringComparison.Ordinal))
                .SelectMany(other => new[]
                {
                    $"Knorooms.Modules.Modules.{other}.Application",
                    $"Knorooms.Modules.Modules.{other}.Infrastructure"
                })
                .ToArray();

            var result = Types.InAssembly(assembly)
                .That()
                .ResideInNamespaceStartingWith($"Knorooms.Modules.Modules.{module}")
                .ShouldNot()
                .HaveDependencyOnAny(forbiddenNamespaces)
                .GetResult();

            Assert.True(
                result.IsSuccessful,
                $"El módulo '{module}' tiene dependencias hacia implementaciones internas de otro módulo: {string.Join(", ", result.FailingTypeNames ?? [])}");
        }
    }

    [Fact]
    public void ApiControllers_ShouldNotReturnDomainEntitiesDirectly()
    {
        var apiAssembly = typeof(PlatformController).Assembly;
        var controllerTypes = apiAssembly.GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract);

        foreach (var controller in controllerTypes)
        {
            foreach (var method in controller.GetMethods().Where(m => m.DeclaringType == controller && m.IsPublic))
            {
                var returnType = method.ReturnType;
                Assert.False(
                    ContainsEntityType(returnType),
                    $"El método '{controller.Name}.{method.Name}' expone directamente una entidad de dominio ({returnType}). Debe usar un DTO.");
            }
        }
    }

    private static bool ContainsEntityType(Type type)
    {
        if (typeof(Entity).IsAssignableFrom(type))
        {
            return true;
        }

        if (!type.IsGenericType)
        {
            return false;
        }

        return type.GetGenericArguments().Any(ContainsEntityType);
    }
}
