using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldenLine.Desktop.Migrations
{
    /// <inheritdoc />
    public partial class DropInstructions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"Instructions\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Instructions",
                columns: table => new
                {
                    InstructionID = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Olusturan = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    OlusturmaTarihi = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TalimatAdi = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    TalimatNo = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Instructions", x => x.InstructionID);
                });
        }
    }
}

