using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SprintMonitor.API.Migrations
{
    /// <summary>
    /// Records the addition of ML risk columns (MlRiskLevel, FinalRiskLevel, MlConfidence)
    /// to the RiskAssessments table. These columns were added directly to the database
    /// in a previous session, so this migration only records them in the migration history.
    /// </summary>
    public partial class AddMlRiskFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Columns already exist in the database - added in a previous session.
            // Using IF NOT EXISTS to be idempotent.
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('RiskAssessments') AND name = 'MlRiskLevel')
                BEGIN
                    ALTER TABLE [RiskAssessments] ADD [MlRiskLevel] int NULL;
                END

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('RiskAssessments') AND name = 'FinalRiskLevel')
                BEGIN
                    ALTER TABLE [RiskAssessments] ADD [FinalRiskLevel] int NULL;
                END

                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('RiskAssessments') AND name = 'MlConfidence')
                BEGIN
                    ALTER TABLE [RiskAssessments] ADD [MlConfidence] decimal(5,4) NULL;
                END
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "MlRiskLevel", table: "RiskAssessments");
            migrationBuilder.DropColumn(name: "FinalRiskLevel", table: "RiskAssessments");
            migrationBuilder.DropColumn(name: "MlConfidence", table: "RiskAssessments");
        }
    }
}
