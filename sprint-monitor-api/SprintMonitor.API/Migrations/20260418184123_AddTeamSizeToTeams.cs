using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SprintMonitor.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamSizeToTeams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TeamSize",
                table: "Teams",
                type: "int",
                nullable: false,
                defaultValue: 5);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TeamSize",
                table: "Teams");
        }
    }
}
