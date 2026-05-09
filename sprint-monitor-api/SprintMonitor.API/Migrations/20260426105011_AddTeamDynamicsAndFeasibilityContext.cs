using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SprintMonitor.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamDynamicsAndFeasibilityContext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AvgExperienceLevel",
                table: "Sprints",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CollaborationScore",
                table: "Sprints",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MeetingHoursPerSprint",
                table: "Sprints",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NewMembersCount",
                table: "Sprints",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AvgExperienceLevel",
                table: "RiskAssessments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CollaborationScore",
                table: "RiskAssessments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MeetingHoursPerSprint",
                table: "RiskAssessments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NewMembersCount",
                table: "RiskAssessments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TeamCondition",
                table: "RiskAssessments",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "TeamDynamicsScore",
                table: "RiskAssessments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TeamSize",
                table: "RiskAssessments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "DecisionReason",
                table: "ImplementationFeasibilities",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RiskLevel",
                table: "ImplementationFeasibilities",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TeamCondition",
                table: "ImplementationFeasibilities",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TeamDynamicsScore",
                table: "ImplementationFeasibilities",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvgExperienceLevel",
                table: "Sprints");

            migrationBuilder.DropColumn(
                name: "CollaborationScore",
                table: "Sprints");

            migrationBuilder.DropColumn(
                name: "MeetingHoursPerSprint",
                table: "Sprints");

            migrationBuilder.DropColumn(
                name: "NewMembersCount",
                table: "Sprints");

            migrationBuilder.DropColumn(
                name: "AvgExperienceLevel",
                table: "RiskAssessments");

            migrationBuilder.DropColumn(
                name: "CollaborationScore",
                table: "RiskAssessments");

            migrationBuilder.DropColumn(
                name: "MeetingHoursPerSprint",
                table: "RiskAssessments");

            migrationBuilder.DropColumn(
                name: "NewMembersCount",
                table: "RiskAssessments");

            migrationBuilder.DropColumn(
                name: "TeamCondition",
                table: "RiskAssessments");

            migrationBuilder.DropColumn(
                name: "TeamDynamicsScore",
                table: "RiskAssessments");

            migrationBuilder.DropColumn(
                name: "TeamSize",
                table: "RiskAssessments");

            migrationBuilder.DropColumn(
                name: "DecisionReason",
                table: "ImplementationFeasibilities");

            migrationBuilder.DropColumn(
                name: "RiskLevel",
                table: "ImplementationFeasibilities");

            migrationBuilder.DropColumn(
                name: "TeamCondition",
                table: "ImplementationFeasibilities");

            migrationBuilder.DropColumn(
                name: "TeamDynamicsScore",
                table: "ImplementationFeasibilities");
        }
    }
}
