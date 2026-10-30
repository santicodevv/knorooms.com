using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Platform.Contracts;
using Knorooms.SharedKernel.Authorization;
using Microsoft.EntityFrameworkCore;
namespace Knorooms.Modules.Common.Persistence;
// Proyección de lectura de metadatos administrativos. No consulta tablas académicas.
internal static class InstitutionDirectoryQuery
{
    internal static IQueryable<InstitutionDirectoryEntry> Build(ApplicationDbContext db)
    {
        var now = DateTimeOffset.UtcNow;
        var admins = from membership in db.TenantMemberships.AsNoTracking()
                     join link in db.TenantMembershipRoles.AsNoTracking() on new { membership.TenantId, Id = membership.Id } equals new { link.TenantId, Id = link.MembershipId }
                     join role in db.InstitutionRoles.AsNoTracking() on new { link.TenantId, Id = link.RoleId } equals new { role.TenantId, Id = role.Id }
                     join user in db.Users.AsNoTracking() on membership.UserId equals user.Id
                     where membership.Status == MembershipStatus.Active && role.Code == SystemRoleCatalog.InstitutionAdmin && user.IsActive
                     select new { membership.TenantId, user.Email };
        var query = db.Institutions.AsNoTracking().Select(i => new
        {
            i.Id,
            i.Name,
            i.Slug,
            i.Status,
            i.ContactEmail,
            i.LogoUrl,
            i.CreatedAtUtc,
            AdminEmail = admins.Where(a => a.TenantId == i.Id).OrderBy(a => a.Email).Select(a => a.Email).FirstOrDefault(),
            Invite = db.AdministratorInvitations.Where(v => v.TenantId == i.Id).OrderByDescending(v => v.CreatedAtUtc).ThenByDescending(v => v.Id)
                .Select(v => new { v.Id, v.Email, v.RevokedAtUtc, v.AcceptedAtUtc, v.ExpiresAtUtc, v.DeliveryStatus }).FirstOrDefault(),
            Modules = db.InstitutionModuleSettings.Where(m => m.TenantId == i.Id).Select(m => m.EnabledModules).FirstOrDefault() ?? new string[0]
        }).Select(x => new InstitutionDirectoryEntry
        {
            Id = x.Id,
            Name = x.Name,
            Slug = x.Slug,
            Status = x.Status,
            ContactEmail = x.ContactEmail,
            LogoUrl = x.LogoUrl,
            CreatedAtUtc = x.CreatedAtUtc,
            Modules = x.Modules,
            AdministratorState = x.AdminEmail != null ? "Active" : x.Invite == null || x.Invite.RevokedAtUtc != null || x.Invite.AcceptedAtUtc != null ? "None"
                : x.Invite.ExpiresAtUtc <= now ? "Expired" : x.Invite.DeliveryStatus == "Failed" ? "Failed" : "Pending",
            AdministratorEmail = x.AdminEmail ?? (x.Invite != null && x.Invite.RevokedAtUtc == null && x.Invite.AcceptedAtUtc == null ? x.Invite.Email : null),
            InvitationId = x.Invite != null && x.Invite.RevokedAtUtc == null && x.Invite.AcceptedAtUtc == null ? (Guid?)x.Invite.Id : null
        });
        return query;
    }
    internal static async Task<InstitutionPageDto> ReadAsync(ApplicationDbContext db, string? search, string? status, string? administrator, int page, int pageSize, CancellationToken ct)
    {
        var query = Build(db);
        if (!string.IsNullOrWhiteSpace(search)) { var term = search.Trim().ToLowerInvariant(); query = query.Where(x => EF.Functions.ILike(x.Name, "%" + term.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_") + "%") || x.Slug.Contains(term) || EF.Functions.ILike(x.ContactEmail, "%" + term.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_") + "%") || (x.AdministratorEmail != null && EF.Functions.ILike(x.AdministratorEmail, "%" + term.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_") + "%"))); }
        if (status == "Active") query = query.Where(x => x.Status == Modules.Tenants.Domain.InstitutionStatus.Active);
        if (status == "Suspended") query = query.Where(x => x.Status == Modules.Tenants.Domain.InstitutionStatus.Suspended);
        if (administrator == "NotActive") query = query.Where(x => x.AdministratorState != "Active");
        else if (!string.IsNullOrEmpty(administrator)) query = query.Where(x => x.AdministratorState == administrator);
        var total = await query.CountAsync(ct);
        page = Math.Min(page, Math.Max(1, (int)Math.Ceiling(total / (double)pageSize)));
        var rows = await query.OrderBy(x => x.Name).ThenBy(x => x.Id).Skip((page - 1) * pageSize).Take(pageSize)
            .Select(x => new InstitutionListRow(x.Id, x.Name, x.Slug, x.Status.ToString(), x.ContactEmail, x.LogoUrl, x.AdministratorState, x.AdministratorEmail, x.InvitationId, x.Modules)).ToListAsync(ct);
        return new(rows, total, page, pageSize);
    }
}

internal sealed class InstitutionDirectoryEntry
{
    public Guid Id { get; init; }
    public string Name { get; init; } = "";
    public string Slug { get; init; } = "";
    public Modules.Tenants.Domain.InstitutionStatus Status { get; init; }
    public string ContactEmail { get; init; } = "";
    public string LogoUrl { get; init; } = "";
    public DateTimeOffset CreatedAtUtc { get; init; }
    public string[] Modules { get; init; } = [];
    public string AdministratorState { get; init; } = "";
    public string? AdministratorEmail { get; init; }
    public Guid? InvitationId { get; init; }
}
