using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldenLine.Desktop.Migrations
{
    public partial class AddLogisticsTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LogisticsContainers",
                columns: table => new
                {
                    ContainerId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Length = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Width = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Height = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    MaxWeight = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    ShipmentId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogisticsContainers", x => x.ContainerId);
                    table.ForeignKey(
                        name: "FK_LogisticsContainers_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "ShipmentId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LogisticsProducts",
                columns: table => new
                {
                    ProductId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Length = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Width = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Height = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Weight = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Color = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ProjectId = table.Column<int>(type: "INTEGER", nullable: false),
                    LineProjectId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogisticsProducts", x => x.ProductId);
                    table.ForeignKey(
                        name: "FK_LogisticsProducts_Projects_LineProjectId",
                        column: x => x.LineProjectId,
                        principalTable: "Projects",
                        principalColumn: "ProjeID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LogisticsProducts_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "ProjeID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "LogisticsCrates",
                columns: table => new
                {
                    CrateId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Length = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Width = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Height = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    WeightCapacity = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    ProjectId = table.Column<int>(type: "INTEGER", nullable: false),
                    LineProjectId = table.Column<int>(type: "INTEGER", nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    ShipmentId = table.Column<int>(type: "INTEGER", nullable: true),
                    ContainerId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    PositionX = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    PositionY = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false),
                    Rotation = table.Column<decimal>(type: "TEXT", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogisticsCrates", x => x.CrateId);
                    table.ForeignKey(
                        name: "FK_LogisticsCrates_LogisticsContainers_ContainerId",
                        column: x => x.ContainerId,
                        principalTable: "LogisticsContainers",
                        principalColumn: "ContainerId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_LogisticsCrates_Projects_LineProjectId",
                        column: x => x.LineProjectId,
                        principalTable: "Projects",
                        principalColumn: "ProjeID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LogisticsCrates_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "ProjeID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LogisticsCrates_Shipments_ShipmentId",
                        column: x => x.ShipmentId,
                        principalTable: "Shipments",
                        principalColumn: "ShipmentId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "LogisticsCrateItems",
                columns: table => new
                {
                    LogisticsCrateItemId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CrateId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ProductId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LogisticsCrateItems", x => x.LogisticsCrateItemId);
                    table.ForeignKey(
                        name: "FK_LogisticsCrateItems_LogisticsCrates_CrateId",
                        column: x => x.CrateId,
                        principalTable: "LogisticsCrates",
                        principalColumn: "CrateId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LogisticsCrateItems_LogisticsProducts_ProductId",
                        column: x => x.ProductId,
                        principalTable: "LogisticsProducts",
                        principalColumn: "ProductId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LogisticsContainers_ShipmentId",
                table: "LogisticsContainers",
                column: "ShipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_LogisticsCrateItems_CrateId",
                table: "LogisticsCrateItems",
                column: "CrateId");

            migrationBuilder.CreateIndex(
                name: "IX_LogisticsCrateItems_ProductId",
                table: "LogisticsCrateItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_LogisticsCrates_ContainerId",
                table: "LogisticsCrates",
                column: "ContainerId");

            migrationBuilder.CreateIndex(
                name: "IX_LogisticsCrates_LineProjectId",
                table: "LogisticsCrates",
                column: "LineProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_LogisticsCrates_ProjectId",
                table: "LogisticsCrates",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_LogisticsCrates_ShipmentId",
                table: "LogisticsCrates",
                column: "ShipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_LogisticsProducts_LineProjectId",
                table: "LogisticsProducts",
                column: "LineProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_LogisticsProducts_ProjectId",
                table: "LogisticsProducts",
                column: "ProjectId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LogisticsCrateItems");

            migrationBuilder.DropTable(
                name: "LogisticsCrates");

            migrationBuilder.DropTable(
                name: "LogisticsProducts");

            migrationBuilder.DropTable(
                name: "LogisticsContainers");
        }
    }
}

