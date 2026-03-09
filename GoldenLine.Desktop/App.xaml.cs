using System;
using System.IO;
using System.Windows;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop;

public partial class App : Application
{
    private static readonly string DefaultDatabasePath = Path.Combine(AppContext.BaseDirectory, "app.db");

    public static string ConnectionString { get; private set; } = string.Empty;
    public static DbContextOptions<AppDbContext> DbOptions { get; private set; } =
        new DbContextOptionsBuilder<AppDbContext>().Options;
    public static string MediaRoot { get; } = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "GoldenLine",
        "media");

    protected override void OnStartup(StartupEventArgs e)
    {
        MessageBox.Show("Uygulama baÅŸlatÄ±lÄ±yor...", "Debug");
        try
        {
            InitializeDatabase();
            base.OnStartup(e);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Kritik BaÅŸlatma HatasÄ±:\n{ex.Message}\n\nStack Trace:\n{ex.StackTrace}", 
                "GoldenLine Kritik Hata", MessageBoxButton.OK, MessageBoxImage.Error);
            Environment.Exit(1);
        }
    }

    private static void InitializeDatabase()
    {
        try
        {
            Directory.CreateDirectory(MediaRoot);

            var dbPath = Environment.GetEnvironmentVariable("GoldenLine_DB_PATH");
            if (string.IsNullOrWhiteSpace(dbPath))
            {
                dbPath = DefaultDatabasePath;
            }

            var dataFolder = Path.GetDirectoryName(dbPath) ?? AppContext.BaseDirectory;
            Directory.CreateDirectory(dataFolder);

            var backupsFolder = Path.Combine(dataFolder, ".backups");
            Directory.CreateDirectory(backupsFolder);
            TryHideFolder(backupsFolder);

            TryCreateDailyBackup(dbPath, backupsFolder);

            ConnectionString = BuildConnectionString(dbPath);
            DbOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(ConnectionString)
                .Options;

            using var context = new AppDbContext(DbOptions);
            context.Database.Migrate();
            context.Database.ExecuteSqlRaw("PRAGMA journal_mode=WAL;");
            EnsureAdminUser(context);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Uygulama baÅŸlatÄ±lamadÄ± (VeritabanÄ± HatasÄ±):\n{ex.Message}\n\nStack Trace:\n{ex.StackTrace}", 
                "GoldenLine Kritik Hata", MessageBoxButton.OK, MessageBoxImage.Error);
            Environment.Exit(1);
        }
    }

    private static void TryCreateDailyBackup(string dbPath, string backupsFolder)
    {
        if (!File.Exists(dbPath))
        {
            return;
        }

        var backupName = $"app-{DateTime.Today:yyyyMMdd}.db";
        var backupPath = Path.Combine(backupsFolder, backupName);
        if (File.Exists(backupPath))
        {
            return;
        }

        using var connection = new SqliteConnection(BuildConnectionString(dbPath));
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = $"VACUUM INTO '{EscapeSqlitePath(backupPath)}';";
        command.ExecuteNonQuery();
    }

    private static string BuildConnectionString(string dbPath)
    {
        var builder = new SqliteConnectionStringBuilder
        {
            DataSource = dbPath,
            Mode = SqliteOpenMode.ReadWriteCreate,
            Cache = SqliteCacheMode.Shared
        };

        return builder.ToString();
    }

    private static void TryHideFolder(string folderPath)
    {
        try
        {
            var attributes = File.GetAttributes(folderPath);
            if ((attributes & FileAttributes.Hidden) == 0)
            {
                File.SetAttributes(folderPath, attributes | FileAttributes.Hidden);
            }
        }
        catch
        {
            // Best-effort only.
        }
    }

    private static string EscapeSqlitePath(string path)
    {
        return path.Replace("'", "''");
    }

    private static void EnsureAdminUser(AppDbContext context)
    {
        var hasAdmin = context.Users.Any(user =>
            user.KullaniciAdi == "admin" || user.KullaniciAdi == "Admin");
        if (hasAdmin)
        {
            return;
        }

        var adminUser = new User
        {
            KullaniciAdi = "admin",
            SifreHash = BCrypt.Net.BCrypt.HashPassword("admin"),
            Rol = "Admin"
        };

        context.Users.Add(adminUser);
        context.SaveChanges();
    }
}

