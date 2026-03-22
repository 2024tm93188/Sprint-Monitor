using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SprintMonitor.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Teams",
                columns: table => new
                {
                    TeamId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teams", x => x.TeamId);
                });

            migrationBuilder.CreateTable(
                name: "ImplementationFeasibilities",
                columns: table => new
                {
                    FeasibilityId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamId = table.Column<int>(type: "int", nullable: true),
                    EvaluationDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TechnicalFeasibility = table.Column<bool>(type: "bit", nullable: false),
                    TechnicalNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OperationalFeasibility = table.Column<bool>(type: "bit", nullable: false),
                    OperationalNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    OrganizationalFeasibility = table.Column<bool>(type: "bit", nullable: false),
                    OrganizationalNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IntegrationFeasibility = table.Column<bool>(type: "bit", nullable: false),
                    IntegrationNotes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    MentorComments = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ApprovedBy = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ExpectedBenefits = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    AdoptionChallenges = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ScalabilityConsiderations = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    OverallScore = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImplementationFeasibilities", x => x.FeasibilityId);
                    table.ForeignKey(
                        name: "FK_ImplementationFeasibilities_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "TeamId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "RiskAssessments",
                columns: table => new
                {
                    AssessmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    SprintId = table.Column<int>(type: "int", nullable: true),
                    PlannedCommitment = table.Column<int>(type: "int", nullable: false),
                    TeamAvailability = table.Column<int>(type: "int", nullable: false),
                    ExternalDependencies = table.Column<int>(type: "int", nullable: false),
                    RiskLevel = table.Column<int>(type: "int", nullable: false),
                    TotalScore = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    MaxPossibleScore = table.Column<int>(type: "int", nullable: false),
                    Confidence = table.Column<int>(type: "int", nullable: false),
                    ActualOutcome = table.Column<int>(type: "int", nullable: true),
                    ActualCompletedPoints = table.Column<int>(type: "int", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    AssessedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskAssessments", x => x.AssessmentId);
                    table.ForeignKey(
                        name: "FK_RiskAssessments_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "TeamId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Sprints",
                columns: table => new
                {
                    SprintId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    SprintName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CommittedPoints = table.Column<int>(type: "int", nullable: false),
                    CompletedPoints = table.Column<int>(type: "int", nullable: false),
                    AddedPoints = table.Column<int>(type: "int", nullable: false),
                    RemovedPoints = table.Column<int>(type: "int", nullable: false),
                    TeamAvailability = table.Column<int>(type: "int", nullable: false),
                    TeamSize = table.Column<int>(type: "int", nullable: false),
                    SprintDuration = table.Column<int>(type: "int", nullable: false),
                    HadSpillover = table.Column<bool>(type: "bit", nullable: false),
                    ExternalDependencies = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sprints", x => x.SprintId);
                    table.ForeignKey(
                        name: "FK_Sprints_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "TeamId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TeamSettings",
                columns: table => new
                {
                    SettingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeamId = table.Column<int>(type: "int", nullable: false),
                    SettingKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SettingValue = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamSettings", x => x.SettingId);
                    table.ForeignKey(
                        name: "FK_TeamSettings_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "TeamId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Recommendations",
                columns: table => new
                {
                    RecommendationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssessmentId = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    AddressesRiskFactor = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ActionType = table.Column<int>(type: "int", nullable: false),
                    SuggestedChange = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    WasApplied = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Recommendations", x => x.RecommendationId);
                    table.ForeignKey(
                        name: "FK_Recommendations_RiskAssessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "RiskAssessments",
                        principalColumn: "AssessmentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiskFactors",
                columns: table => new
                {
                    FactorId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssessmentId = table.Column<int>(type: "int", nullable: false),
                    FactorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Score = table.Column<int>(type: "int", nullable: false),
                    MaxScore = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    MetricValue = table.Column<decimal>(type: "decimal(10,4)", nullable: false),
                    Threshold = table.Column<decimal>(type: "decimal(10,4)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskFactors", x => x.FactorId);
                    table.ForeignKey(
                        name: "FK_RiskFactors_RiskAssessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "RiskAssessments",
                        principalColumn: "AssessmentId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiskFeedbacks",
                columns: table => new
                {
                    FeedbackId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AssessmentId = table.Column<int>(type: "int", nullable: false),
                    SprintId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UserRole = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PredictedRisk = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ActualOutcome = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    UserAgreement = table.Column<bool>(type: "bit", nullable: false),
                    AgreementLevel = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RecommendationsHelpful = table.Column<bool>(type: "bit", nullable: false),
                    RecommendationRating = table.Column<int>(type: "int", nullable: false),
                    FeedbackComments = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ImprovementSuggestions = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ActualPointsCompleted = table.Column<int>(type: "int", nullable: true),
                    ActualSpillover = table.Column<bool>(type: "bit", nullable: true),
                    ActualSpilloverPoints = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UsedForCalibration = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskFeedbacks", x => x.FeedbackId);
                    table.ForeignKey(
                        name: "FK_RiskFeedbacks_RiskAssessments_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "RiskAssessments",
                        principalColumn: "AssessmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RiskFeedbacks_Sprints_SprintId",
                        column: x => x.SprintId,
                        principalTable: "Sprints",
                        principalColumn: "SprintId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImplementationFeasibilities_TeamId",
                table: "ImplementationFeasibilities",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_Recommendations_AssessmentId",
                table: "Recommendations",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskAssessments_TeamId",
                table: "RiskAssessments",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskFactors_AssessmentId",
                table: "RiskFactors",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskFeedbacks_AssessmentId",
                table: "RiskFeedbacks",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskFeedbacks_SprintId",
                table: "RiskFeedbacks",
                column: "SprintId");

            migrationBuilder.CreateIndex(
                name: "IX_Sprints_TeamId_SprintName",
                table: "Sprints",
                columns: new[] { "TeamId", "SprintName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teams_TeamName",
                table: "Teams",
                column: "TeamName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TeamSettings_TeamId_SettingKey",
                table: "TeamSettings",
                columns: new[] { "TeamId", "SettingKey" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ImplementationFeasibilities");

            migrationBuilder.DropTable(
                name: "Recommendations");

            migrationBuilder.DropTable(
                name: "RiskFactors");

            migrationBuilder.DropTable(
                name: "RiskFeedbacks");

            migrationBuilder.DropTable(
                name: "TeamSettings");

            migrationBuilder.DropTable(
                name: "RiskAssessments");

            migrationBuilder.DropTable(
                name: "Sprints");

            migrationBuilder.DropTable(
                name: "Teams");
        }
    }
}
