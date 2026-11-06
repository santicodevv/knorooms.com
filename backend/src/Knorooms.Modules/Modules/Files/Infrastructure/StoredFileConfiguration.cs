using Knorooms.Modules.Modules.Authorization.Domain;
using Knorooms.Modules.Modules.Files.Domain;
using Knorooms.Modules.Modules.Tenants.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Knorooms.Modules.Modules.Files.Infrastructure;

internal sealed class StoredFileConfiguration : IEntityTypeConfiguration<StoredFile>
{
    public void Configure(EntityTypeBuilder<StoredFile> builder)
    {
        builder.ToTable("stored_files");

        builder.HasKey(x => x.Id);

        builder.HasAlternateKey(x => new { x.TenantId, x.Id })
            .HasName("ak_stored_files_tenant_id");

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(x => x.TenantId)
            .HasColumnName("tenant_id")
            .IsRequired();

        builder.Property(x => x.OriginalFileName)
            .HasColumnName("original_file_name")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(x => x.ContentType)
            .HasColumnName("content_type")
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(x => x.SizeBytes)
            .HasColumnName("size_bytes")
            .IsRequired();

        builder.Property(x => x.Sha256)
            .HasColumnName("sha256")
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(x => x.UploadedByUserId)
            .HasColumnName("uploaded_by_user_id")
            .IsRequired();

        builder.Property(x => x.StorageKey)
            .HasColumnName("storage_key")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.DeletedAtUtc)
            .HasColumnName("deleted_at_utc");

        builder.Property(x => x.CreatedAtUtc)
            .HasColumnName("created_at_utc")
            .IsRequired();

        builder.Property(x => x.UpdatedAtUtc)
            .HasColumnName("updated_at_utc");

        builder.HasIndex(x => new { x.TenantId, x.StorageKey })
            .IsUnique()
            .HasDatabaseName("ux_stored_files_tenant_storage_key");

        builder.HasOne<Institution>()
            .WithMany()
            .HasForeignKey(x => x.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        // FK compuesta: el usuario debe pertenecer al mismo colegio del archivo.
        builder.HasOne<TenantMembership>()
            .WithMany()
            .HasForeignKey(x => new { x.TenantId, x.UploadedByUserId })
            .HasPrincipalKey(x => new { x.TenantId, x.UserId })
            .OnDelete(DeleteBehavior.Restrict);

        builder.Ignore(x => x.DomainEvents);
        builder.Ignore(x => x.IsDeleted);
    }
}