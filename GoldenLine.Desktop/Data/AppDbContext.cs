using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Node> Nodes => Set<Node>();
    public DbSet<Edge> Edges => Set<Edge>();
    public DbSet<User> Users => Set<User>();
    public DbSet<EquipmentItem> EquipmentItems => Set<EquipmentItem>();
    public DbSet<Personnel> Personnel => Set<Personnel>();
    public DbSet<DailyStatus> DailyStatuses => Set<DailyStatus>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    public DbSet<InventoryAssignment> InventoryAssignments => Set<InventoryAssignment>();
    public DbSet<InventoryLocation> InventoryLocations => Set<InventoryLocation>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<ItemLocationStock> ItemLocationStocks => Set<ItemLocationStock>();
    public DbSet<InventoryCountSession> InventoryCountSessions => Set<InventoryCountSession>();
    public DbSet<InventoryCountLine> InventoryCountLines => Set<InventoryCountLine>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<InventorySnapshot> InventorySnapshots => Set<InventorySnapshot>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<LogisticsProduct> LogisticsProducts => Set<LogisticsProduct>();
    public DbSet<LogisticsCrate> LogisticsCrates => Set<LogisticsCrate>();
    public DbSet<LogisticsCrateItem> LogisticsCrateItems => Set<LogisticsCrateItem>();
    public DbSet<LogisticsContainer> LogisticsContainers => Set<LogisticsContainer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Node>()
            .HasOne(n => n.ParentNode)
            .WithMany(n => n.ChildNodes)
            .HasForeignKey(n => n.ParentNodeId)
            .OnDelete(DeleteBehavior.ClientSetNull);

        modelBuilder.Entity<DailyStatus>()
            .HasIndex(s => new { s.PersonnelId, s.Date })
            .IsUnique();

        modelBuilder.Entity<DailyStatus>()
            .Property(s => s.StatusType)
            .HasConversion<int>();

        modelBuilder.Entity<InventoryAssignment>()
            .HasIndex(a => new { a.EquipmentItemId, a.PersonnelId, a.Status })
            .HasDatabaseName("IX_Assignments_Item_Person_Status");

        modelBuilder.Entity<InventoryAssignment>()
            .Property(a => a.Status)
            .HasMaxLength(30)
            .HasDefaultValue("Active");

        modelBuilder.Entity<InventoryAssignment>()
            .HasOne(a => a.EquipmentItem)
            .WithMany(i => i.Assignments)
            .HasForeignKey(a => a.EquipmentItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InventoryAssignment>()
            .HasOne(a => a.Personnel)
            .WithMany()
            .HasForeignKey(a => a.PersonnelId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InventoryMovement>()
            .HasOne(m => m.EquipmentItem)
            .WithMany(i => i.Movements)
            .HasForeignKey(m => m.EquipmentItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InventoryMovement>()
            .HasOne(m => m.Personnel)
            .WithMany()
            .HasForeignKey(m => m.PersonnelId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InventoryMovement>()
            .HasOne(m => m.InventoryAssignment)
            .WithMany(a => a.Movements)
            .HasForeignKey(m => m.InventoryAssignmentId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Location>()
            .Property(l => l.Name)
            .HasMaxLength(150);

        modelBuilder.Entity<Location>()
            .Property(l => l.Code)
            .HasMaxLength(50);

        modelBuilder.Entity<Location>()
            .Property(l => l.Description)
            .HasMaxLength(400);

        modelBuilder.Entity<ItemLocationStock>()
            .HasOne(ls => ls.EquipmentItem)
            .WithMany(i => i.LocationStocks)
            .HasForeignKey(ls => ls.EquipmentItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ItemLocationStock>()
            .HasOne(ls => ls.Location)
            .WithMany(l => l.ItemLocationStocks)
            .HasForeignKey(ls => ls.LocationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InventoryCountSession>()
            .HasOne(s => s.Location)
            .WithMany()
            .HasForeignKey(s => s.LocationId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InventoryCountSession>()
            .Property(s => s.Status)
            .HasMaxLength(20)
            .HasDefaultValue("Open");

        modelBuilder.Entity<InventoryCountLine>()
            .HasOne(l => l.Session)
            .WithMany(s => s.Lines)
            .HasForeignKey(l => l.InventoryCountSessionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InventoryCountLine>()
            .HasOne(l => l.EquipmentItem)
            .WithMany()
            .HasForeignKey(l => l.EquipmentItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InventoryCountLine>()
            .HasOne(l => l.AdjustmentMovement)
            .WithMany()
            .HasForeignKey(l => l.AdjustmentMovementId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Supplier>()
            .Property(s => s.Name)
            .HasMaxLength(200);

        modelBuilder.Entity<Supplier>()
            .HasIndex(s => s.Name)
            .IsUnique();

        modelBuilder.Entity<EquipmentItem>()
            .HasOne(i => i.Supplier)
            .WithMany(s => s.EquipmentItems)
            .HasForeignKey(i => i.SupplierId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<InventorySnapshot>(entity =>
        {
            entity.ToTable("InventorySnapshots");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PayloadJson).IsRequired();
            entity.Property(e => e.UpdatedUtc).IsRequired();
        });

        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.Property(s => s.Status)
                .HasMaxLength(30)
                .HasDefaultValue("planned");

            entity.Property(s => s.ShipmentType)
                .HasMaxLength(20)
                .HasDefaultValue("land");

            entity.HasOne(s => s.Project)
                .WithMany()
                .HasForeignKey(s => s.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LogisticsProduct>(entity =>
        {
            entity.HasKey(p => p.ProductId);
            entity.Property(p => p.ProductId).HasMaxLength(50);
            entity.Property(p => p.Name).HasMaxLength(200);
            entity.Property(p => p.Color).HasMaxLength(50);
            entity.Property(p => p.Length).HasPrecision(18, 2);
            entity.Property(p => p.Width).HasPrecision(18, 2);
            entity.Property(p => p.Height).HasPrecision(18, 2);
            entity.Property(p => p.Weight).HasPrecision(18, 2);
            entity.HasOne(p => p.Project)
                .WithMany()
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(p => p.LineProject)
                .WithMany()
                .HasForeignKey(p => p.LineProjectId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LogisticsCrate>(entity =>
        {
            entity.HasKey(c => c.CrateId);
            entity.Property(c => c.CrateId).HasMaxLength(50);
            entity.Property(c => c.Name).HasMaxLength(100);
            entity.Property(c => c.Status).HasMaxLength(30);
            entity.Property(c => c.ContainerId).HasMaxLength(50);
            entity.Property(c => c.Length).HasPrecision(18, 2);
            entity.Property(c => c.Width).HasPrecision(18, 2);
            entity.Property(c => c.Height).HasPrecision(18, 2);
            entity.Property(c => c.WeightCapacity).HasPrecision(18, 2);
            entity.Property(c => c.PositionX).HasPrecision(18, 2);
            entity.Property(c => c.PositionY).HasPrecision(18, 2);
            entity.Property(c => c.Rotation).HasPrecision(18, 2);
            entity.HasOne(c => c.Shipment)
                .WithMany()
                .HasForeignKey(c => c.ShipmentId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(c => c.Container)
                .WithMany(c => c.Crates)
                .HasForeignKey(c => c.ContainerId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(c => c.Project)
                .WithMany()
                .HasForeignKey(c => c.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(c => c.LineProject)
                .WithMany()
                .HasForeignKey(c => c.LineProjectId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LogisticsCrateItem>(entity =>
        {
            entity.HasKey(i => i.LogisticsCrateItemId);
            entity.Property(i => i.CrateId).HasMaxLength(50);
            entity.Property(i => i.ProductId).HasMaxLength(50);
            entity.HasOne(i => i.Crate)
                .WithMany(c => c.Items)
                .HasForeignKey(i => i.CrateId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(i => i.Product)
                .WithMany(p => p.CrateItems)
                .HasForeignKey(i => i.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<LogisticsContainer>(entity =>
        {
            entity.HasKey(c => c.ContainerId);
            entity.Property(c => c.ContainerId).HasMaxLength(50);
            entity.Property(c => c.Name).HasMaxLength(100);
            entity.Property(c => c.Type).HasMaxLength(20);
            entity.Property(c => c.Length).HasPrecision(18, 2);
            entity.Property(c => c.Width).HasPrecision(18, 2);
            entity.Property(c => c.Height).HasPrecision(18, 2);
            entity.Property(c => c.MaxWeight).HasPrecision(18, 2);
            entity.HasOne(c => c.Shipment)
                .WithMany()
                .HasForeignKey(c => c.ShipmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}

