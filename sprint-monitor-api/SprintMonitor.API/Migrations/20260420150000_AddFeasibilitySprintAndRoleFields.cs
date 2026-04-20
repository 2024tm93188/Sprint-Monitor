using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SprintMonitor.API.Migrations
{
    [Microsoft.EntityFrameworkCore.Infrastructure.DbContext(typeof(SprintMonitor.API.Data.SprintMonitorDbContext))]
    [Migration("20260420150000_AddFeasibilitySprintAndRoleFields")]
    public partial class AddFeasibilitySprintAndRoleFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF COL_LENGTH('ImplementationFeasibilities', 'SprintId') IS NULL
BEGIN
    ALTER TABLE [ImplementationFeasibilities] ADD [SprintId] int NULL;
END
");

            migrationBuilder.Sql(@"
IF COL_LENGTH('ImplementationFeasibilities', 'UserRole') IS NULL
BEGIN
    ALTER TABLE [ImplementationFeasibilities] ADD [UserRole] nvarchar(100) NULL;
END
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ImplementationFeasibilities_SprintId'
      AND object_id = OBJECT_ID('[ImplementationFeasibilities]')
)
BEGIN
    CREATE INDEX [IX_ImplementationFeasibilities_SprintId] ON [ImplementationFeasibilities] ([SprintId]);
END
");

            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_ImplementationFeasibilities_Sprints_SprintId'
)
BEGIN
    ALTER TABLE [ImplementationFeasibilities]
    ADD CONSTRAINT [FK_ImplementationFeasibilities_Sprints_SprintId]
    FOREIGN KEY ([SprintId]) REFERENCES [Sprints] ([SprintId]) ON DELETE NO ACTION;
END
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_ImplementationFeasibilities_Sprints_SprintId')
BEGIN
    ALTER TABLE [ImplementationFeasibilities] DROP CONSTRAINT [FK_ImplementationFeasibilities_Sprints_SprintId];
END
");

            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ImplementationFeasibilities_SprintId'
      AND object_id = OBJECT_ID('[ImplementationFeasibilities]')
)
BEGIN
    DROP INDEX [IX_ImplementationFeasibilities_SprintId] ON [ImplementationFeasibilities];
END
");

            migrationBuilder.Sql(@"
IF COL_LENGTH('ImplementationFeasibilities', 'SprintId') IS NOT NULL
BEGIN
    ALTER TABLE [ImplementationFeasibilities] DROP COLUMN [SprintId];
END
");

            migrationBuilder.Sql(@"
IF COL_LENGTH('ImplementationFeasibilities', 'UserRole') IS NOT NULL
BEGIN
    ALTER TABLE [ImplementationFeasibilities] DROP COLUMN [UserRole];
END
");
        }
    }
}