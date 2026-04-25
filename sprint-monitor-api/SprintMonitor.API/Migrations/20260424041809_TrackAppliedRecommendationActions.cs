using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SprintMonitor.API.Migrations
{
    /// <inheritdoc />
    public partial class TrackAppliedRecommendationActions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AfterRiskLevel",
                table: "Recommendations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AfterScore",
                table: "Recommendations",
                type: "decimal(5,2)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AppliedAt",
                table: "Recommendations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AppliedBy",
                table: "Recommendations",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BeforeRiskLevel",
                table: "Recommendations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BeforeScore",
                table: "Recommendations",
                type: "decimal(5,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ImpactScoreChange",
                table: "Recommendations",
                type: "decimal(5,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AfterRiskLevel",
                table: "Recommendations");

            migrationBuilder.DropColumn(
                name: "AfterScore",
                table: "Recommendations");

            migrationBuilder.DropColumn(
                name: "AppliedAt",
                table: "Recommendations");

            migrationBuilder.DropColumn(
                name: "AppliedBy",
                table: "Recommendations");

            migrationBuilder.DropColumn(
                name: "BeforeRiskLevel",
                table: "Recommendations");

            migrationBuilder.DropColumn(
                name: "BeforeScore",
                table: "Recommendations");

            migrationBuilder.DropColumn(
                name: "ImpactScoreChange",
                table: "Recommendations");
        }
    }
}
