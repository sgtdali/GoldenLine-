using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldenLine.Desktop.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "InventoryLocations",
                columns: table => new
                {
                    InventoryLocationID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryLocations", x => x.InventoryLocationID);
                });

            migrationBuilder.CreateTable(
                name: "InventorySnapshots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    PayloadJson = table.Column<string>(type: "TEXT", nullable: false),
                    UpdatedUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventorySnapshots", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    LocationId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Code = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "TEXT", maxLength: 400, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.LocationId);
                });

            migrationBuilder.CreateTable(
                name: "Personnel",
                columns: table => new
                {
                    PersonnelId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FullName = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Department = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                    Role = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    TeamOrProject = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    EmploymentStatus = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    Skills = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    PrimaryLocation = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    CurrentProject = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Personnel", x => x.PersonnelId);
                });

            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    ProjeID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProjeAdi = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    OlusturmaTarihi = table.Column<DateTime>(type: "TEXT", nullable: false),
                    OlusturanKullanici = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    SonDuzenlemeTarihi = table.Column<DateTime>(type: "TEXT", nullable: true),
                    SonDuzenleyenKullanici = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.ProjeID);
                });

            migrationBuilder.CreateTable(
                name: "Suppliers",
                columns: table => new
                {
                    SupplierId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    ContactName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Address = table.Column<string>(type: "TEXT", maxLength: 400, nullable: true),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Suppliers", x => x.SupplierId);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    KullaniciAdi = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    SifreHash = table.Column<string>(type: "TEXT", nullable: false),
                    Rol = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserID);
                });

            migrationBuilder.CreateTable(
                name: "InventoryCountSessions",
                columns: table => new
                {
                    InventoryCountSessionId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    LocationId = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false, defaultValue: "Open")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryCountSessions", x => x.InventoryCountSessionId);
                    table.ForeignKey(
                        name: "FK_InventoryCountSessions_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "LocationId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DailyStatuses",
                columns: table => new
                {
                    DailyStatusId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PersonnelId = table.Column<int>(type: "INTEGER", nullable: false),
                    StatusType = table.Column<int>(type: "INTEGER", nullable: false),
                    ProjectCode = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    ProjectName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Location = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    Note = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedBy = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyStatuses", x => x.DailyStatusId);
                    table.ForeignKey(
                        name: "FK_DailyStatuses_Personnel_PersonnelId",
                        column: x => x.PersonnelId,
                        principalTable: "Personnel",
                        principalColumn: "PersonnelId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Edges",
                columns: table => new
                {
                    EdgeID = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    ProjeID = table.Column<int>(type: "INTEGER", nullable: false),
                    KaynakNodeID = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    HedefNodeID = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    DataJson = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Edges", x => x.EdgeID);
                    table.ForeignKey(
                        name: "FK_Edges_Projects_ProjeID",
                        column: x => x.ProjeID,
                        principalTable: "Projects",
                        principalColumn: "ProjeID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Nodes",
                columns: table => new
                {
                    NodeID = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ProjeID = table.Column<int>(type: "INTEGER", nullable: false),
                    NodeAdi = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Tip = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    X_Pozisyonu = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Y_Pozisyonu = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    DataJson = table.Column<string>(type: "TEXT", nullable: true),
                    ParentNodeId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Nodes", x => x.NodeID);
                    table.ForeignKey(
                        name: "FK_Nodes_Nodes_ParentNodeId",
                        column: x => x.ParentNodeId,
                        principalTable: "Nodes",
                        principalColumn: "NodeID");
                    table.ForeignKey(
                        name: "FK_Nodes_Projects_ProjeID",
                        column: x => x.ProjeID,
                        principalTable: "Projects",
                        principalColumn: "ProjeID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EquipmentItems",
                columns: table => new
                {
                    EquipmentItemID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    KalemNo = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    KalemTanim = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    OlcuAciklama = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    UreticiKodu = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    UreticiKodu2 = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Tedarikci = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    AnaGrup = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    AraGrup = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    AltGrup = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    SupplierId = table.Column<int>(type: "INTEGER", nullable: true),
                    Durum = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Lokasyon = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    Stok = table.Column<int>(type: "INTEGER", nullable: false),
                    AssignedQuantity = table.Column<int>(type: "INTEGER", nullable: false),
                    MinStock = table.Column<int>(type: "INTEGER", nullable: true),
                    IsCalibrationRequired = table.Column<bool>(type: "INTEGER", nullable: false),
                    LastCalibrationDate = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CalibrationIntervalDays = table.Column<int>(type: "INTEGER", nullable: true),
                    SonKullanimTarihi = table.Column<DateTime>(type: "TEXT", nullable: true),
                    SayimTarihi = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Fiyat = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EquipmentItems", x => x.EquipmentItemID);
                    table.ForeignKey(
                        name: "FK_EquipmentItems_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "SupplierId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "InventoryAssignments",
                columns: table => new
                {
                    InventoryAssignmentId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EquipmentItemId = table.Column<int>(type: "INTEGER", nullable: false),
                    PersonnelId = table.Column<int>(type: "INTEGER", nullable: false),
                    QuantityRemaining = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false, defaultValue: "Active"),
                    AssignedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ClosedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Note = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryAssignments", x => x.InventoryAssignmentId);
                    table.ForeignKey(
                        name: "FK_InventoryAssignments_EquipmentItems_EquipmentItemId",
                        column: x => x.EquipmentItemId,
                        principalTable: "EquipmentItems",
                        principalColumn: "EquipmentItemID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventoryAssignments_Personnel_PersonnelId",
                        column: x => x.PersonnelId,
                        principalTable: "Personnel",
                        principalColumn: "PersonnelId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ItemLocationStocks",
                columns: table => new
                {
                    ItemLocationStockId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EquipmentItemId = table.Column<int>(type: "INTEGER", nullable: false),
                    LocationId = table.Column<int>(type: "INTEGER", nullable: false),
                    QuantityOnHand = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemLocationStocks", x => x.ItemLocationStockId);
                    table.ForeignKey(
                        name: "FK_ItemLocationStocks_EquipmentItems_EquipmentItemId",
                        column: x => x.EquipmentItemId,
                        principalTable: "EquipmentItems",
                        principalColumn: "EquipmentItemID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ItemLocationStocks_Locations_LocationId",
                        column: x => x.LocationId,
                        principalTable: "Locations",
                        principalColumn: "LocationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InventoryMovements",
                columns: table => new
                {
                    InventoryMovementId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EquipmentItemId = table.Column<int>(type: "INTEGER", nullable: false),
                    PersonnelId = table.Column<int>(type: "INTEGER", nullable: true),
                    MovementType = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedBy = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    InventoryAssignmentId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryMovements", x => x.InventoryMovementId);
                    table.ForeignKey(
                        name: "FK_InventoryMovements_EquipmentItems_EquipmentItemId",
                        column: x => x.EquipmentItemId,
                        principalTable: "EquipmentItems",
                        principalColumn: "EquipmentItemID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InventoryMovements_InventoryAssignments_InventoryAssignmentId",
                        column: x => x.InventoryAssignmentId,
                        principalTable: "InventoryAssignments",
                        principalColumn: "InventoryAssignmentId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_InventoryMovements_Personnel_PersonnelId",
                        column: x => x.PersonnelId,
                        principalTable: "Personnel",
                        principalColumn: "PersonnelId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "InventoryCountLines",
                columns: table => new
                {
                    InventoryCountLineId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    InventoryCountSessionId = table.Column<int>(type: "INTEGER", nullable: false),
                    EquipmentItemId = table.Column<int>(type: "INTEGER", nullable: false),
                    SystemQuantity = table.Column<int>(type: "INTEGER", nullable: false),
                    CountedQuantity = table.Column<int>(type: "INTEGER", nullable: true),
                    AdjustmentMovementId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryCountLines", x => x.InventoryCountLineId);
                    table.ForeignKey(
                        name: "FK_InventoryCountLines_EquipmentItems_EquipmentItemId",
                        column: x => x.EquipmentItemId,
                        principalTable: "EquipmentItems",
                        principalColumn: "EquipmentItemID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_InventoryCountLines_InventoryCountSessions_InventoryCountSessionId",
                        column: x => x.InventoryCountSessionId,
                        principalTable: "InventoryCountSessions",
                        principalColumn: "InventoryCountSessionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InventoryCountLines_InventoryMovements_AdjustmentMovementId",
                        column: x => x.AdjustmentMovementId,
                        principalTable: "InventoryMovements",
                        principalColumn: "InventoryMovementId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyStatuses_PersonnelId_Date",
                table: "DailyStatuses",
                columns: new[] { "PersonnelId", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Edges_ProjeID",
                table: "Edges",
                column: "ProjeID");

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentItems_SupplierId",
                table: "EquipmentItems",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_Assignments_Item_Person_Status",
                table: "InventoryAssignments",
                columns: new[] { "EquipmentItemId", "PersonnelId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryAssignments_PersonnelId",
                table: "InventoryAssignments",
                column: "PersonnelId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryCountLines_AdjustmentMovementId",
                table: "InventoryCountLines",
                column: "AdjustmentMovementId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryCountLines_EquipmentItemId",
                table: "InventoryCountLines",
                column: "EquipmentItemId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryCountLines_InventoryCountSessionId",
                table: "InventoryCountLines",
                column: "InventoryCountSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryCountSessions_LocationId",
                table: "InventoryCountSessions",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryMovements_EquipmentItemId",
                table: "InventoryMovements",
                column: "EquipmentItemId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryMovements_InventoryAssignmentId",
                table: "InventoryMovements",
                column: "InventoryAssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryMovements_PersonnelId",
                table: "InventoryMovements",
                column: "PersonnelId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemLocationStocks_EquipmentItemId",
                table: "ItemLocationStocks",
                column: "EquipmentItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ItemLocationStocks_LocationId",
                table: "ItemLocationStocks",
                column: "LocationId");

            migrationBuilder.CreateIndex(
                name: "IX_Nodes_ParentNodeId",
                table: "Nodes",
                column: "ParentNodeId");

            migrationBuilder.CreateIndex(
                name: "IX_Nodes_ProjeID",
                table: "Nodes",
                column: "ProjeID");

            migrationBuilder.CreateIndex(
                name: "IX_Suppliers_Name",
                table: "Suppliers",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DailyStatuses");

            migrationBuilder.DropTable(
                name: "Edges");

            migrationBuilder.DropTable(
                name: "InventoryCountLines");

            migrationBuilder.DropTable(
                name: "InventoryLocations");

            migrationBuilder.DropTable(
                name: "InventorySnapshots");

            migrationBuilder.DropTable(
                name: "ItemLocationStocks");

            migrationBuilder.DropTable(
                name: "Nodes");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "InventoryCountSessions");

            migrationBuilder.DropTable(
                name: "InventoryMovements");

            migrationBuilder.DropTable(
                name: "Projects");

            migrationBuilder.DropTable(
                name: "Locations");

            migrationBuilder.DropTable(
                name: "InventoryAssignments");

            migrationBuilder.DropTable(
                name: "EquipmentItems");

            migrationBuilder.DropTable(
                name: "Personnel");

            migrationBuilder.DropTable(
                name: "Suppliers");
        }
    }
}

