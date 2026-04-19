using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SprintMonitor.API.Migrations;

public partial class SprintAssessmentRefactor : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "SprintNumber",
            table: "Sprints",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "Status",
            table: "Sprints",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "Iteration",
            table: "RiskAssessments",
            type: "int",
            nullable: false,
            defaultValue: 1);

        migrationBuilder.AddColumn<bool>(
            name: "IsFinal",
            table: "RiskAssessments",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.Sql(@"
WITH NumberedSprints AS (
    SELECT SprintId, ROW_NUMBER() OVER (PARTITION BY TeamId ORDER BY CreatedAt, SprintId) AS SprintRowNumber
    FROM Sprints
)
UPDATE s
SET SprintNumber = n.SprintRowNumber,
    Status = 2
FROM Sprints s
INNER JOIN NumberedSprints n ON s.SprintId = n.SprintId;
");

        migrationBuilder.Sql(@"
WITH NumberedAssessments AS (
    SELECT AssessmentId,
           ROW_NUMBER() OVER (PARTITION BY SprintId ORDER BY AssessedAt, AssessmentId) AS IterationNumber,
           ROW_NUMBER() OVER (PARTITION BY SprintId ORDER BY AssessedAt DESC, AssessmentId DESC) AS FinalRank
    FROM RiskAssessments
)
UPDATE ra
SET Iteration = n.IterationNumber,
    IsFinal = CASE WHEN n.FinalRank = 1 THEN 1 ELSE 0 END
FROM RiskAssessments ra
INNER JOIN NumberedAssessments n ON ra.AssessmentId = n.AssessmentId;
");

        migrationBuilder.CreateIndex(
            name: "IX_Sprints_TeamId_SprintNumber",
            table: "Sprints",
            columns: new[] { "TeamId", "SprintNumber" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_RiskAssessments_SprintId_Iteration",
            table: "RiskAssessments",
            columns: new[] { "SprintId", "Iteration" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_RiskAssessments_SprintId_IsFinal",
            table: "RiskAssessments",
            columns: new[] { "SprintId", "IsFinal" },
            unique: true,
            filter: "[IsFinal] = 1");

        migrationBuilder.CreateIndex(
            name: "IX_RiskFeedbacks_SprintId",
            table: "RiskFeedbacks",
            column: "SprintId",
            unique: true,
            filter: "[SprintId] IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "IX_RiskAssessments_SprintId",
            table: "RiskAssessments",
            column: "SprintId");

        migrationBuilder.AddForeignKey(
            name: "FK_RiskAssessments_Sprints_SprintId",
            table: "RiskAssessments",
            column: "SprintId",
            principalTable: "Sprints",
            principalColumn: "SprintId",
            onDelete: ReferentialAction.Cascade);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_RiskAssessments_Sprints_SprintId",
            table: "RiskAssessments");

        migrationBuilder.DropIndex(
            name: "IX_RiskAssessments_SprintId",
            table: "RiskAssessments");

        migrationBuilder.DropIndex(
            name: "IX_RiskFeedbacks_SprintId",
            table: "RiskFeedbacks");

        migrationBuilder.DropIndex(
            name: "IX_RiskAssessments_SprintId_IsFinal",
            table: "RiskAssessments");

        migrationBuilder.DropIndex(
            name: "IX_RiskAssessments_SprintId_Iteration",
            table: "RiskAssessments");

        migrationBuilder.DropIndex(
            name: "IX_Sprints_TeamId_SprintNumber",
            table: "Sprints");

        migrationBuilder.DropColumn(
            name: "SprintNumber",
            table: "Sprints");

        migrationBuilder.DropColumn(
            name: "Status",
            table: "Sprints");

        migrationBuilder.DropColumn(
            name: "Iteration",
            table: "RiskAssessments");

        migrationBuilder.DropColumn(
            name: "IsFinal",
            table: "RiskAssessments");
    }
}
