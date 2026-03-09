using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldenLine.Desktop.Migrations
{
    /// <inheritdoc />
    public partial class DropSiteLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"SiteLogs\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SiteLogs",
                columns: table => new
                {
                    SiteLogId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    HasCriticalIssues = table.Column<bool>(type: "INTEGER", nullable: false),
                    Location = table.Column<string>(type: "TEXT", maxLength: 160, nullable: true),
                    ProjectName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    SiteManager = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    Summary = table.Column<string>(type: "TEXT", maxLength: 800, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteLogs", x => x.SiteLogId);
                });
        }
    }
}

