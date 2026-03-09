using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GoldenLine.Desktop.Migrations
{
    public partial class AddProjectHierarchyFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProjectType",
                table: "Projects",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "machine");

            migrationBuilder.AddColumn<int>(
                name: "ParentProjectId",
                table: "Projects",
                type: "INTEGER",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProjectType",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "ParentProjectId",
                table: "Projects");
        }
    }
}

