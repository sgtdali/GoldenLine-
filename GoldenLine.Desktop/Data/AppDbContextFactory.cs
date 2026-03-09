using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GoldenLine.Desktop.Data;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    private const string DefaultDatabasePath = @"\\sunucu\Data\REPKON_ORTAK\Ortak\Tayfun_Vural\GoldenLine\app.db";

    public AppDbContext CreateDbContext(string[] args)
    {
        var dbPath = Environment.GetEnvironmentVariable("GoldenLine_DB_PATH");
        if (string.IsNullOrWhiteSpace(dbPath))
        {
            dbPath = DefaultDatabasePath;
        }

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseSqlite($"Data Source={dbPath}");

        return new AppDbContext(optionsBuilder.Options);
    }
}

