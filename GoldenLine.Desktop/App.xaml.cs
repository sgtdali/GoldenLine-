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
        MessageBox.Show("Uygulama başlatılıyor...", "Debug");
        try
        {
            InitializeDatabase();
            base.OnStartup(e);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Kritik Başlatma Hatası:\n{ex.Message}\n\nStack Trace:\n{ex.StackTrace}", 
                "GoldenLine Kritik Hata", MessageBoxButton.OK, MessageBoxImage.Error);
            Environment.Exit(1);
        }
    }

    protected override void OnExit(ExitEventArgs e)
    {
        CleanupUserTracking();
        base.OnExit(e);
    }

    private static string? _currentUserTrackingFile;

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

            // Active User Tracking (.wh files)
            TrackActiveUser(dataFolder);

            var backupsFolder = Path.Combine(dataFolder, ".backups");
            Directory.CreateDirectory(backupsFolder);
            TryHideFolder(backupsFolder);

            TryCreateLaunchBackup(dbPath, backupsFolder);

            ConnectionString = BuildConnectionString(dbPath);
            DbOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(ConnectionString)
                .Options;

            using var context = new AppDbContext(DbOptions);
            context.Database.Migrate();
            
            // WAL (Write-Ahead Logging) mode is critical for multi-user access
            context.Database.ExecuteSqlRaw("PRAGMA journal_mode=WAL;");
            context.Database.ExecuteSqlRaw("PRAGMA synchronous=NORMAL;");
            
            EnsureAdminUser(context);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Uygulama başlatılamadı (Veritabanı Hatası):\n{ex.Message}\n\nStack Trace:\n{ex.StackTrace}", 
                "GoldenLine Kritik Hata", MessageBoxButton.OK, MessageBoxImage.Error);
            Environment.Exit(1);
        }
    }

    private static void TrackActiveUser(string dataFolder)
    {
        try
        {
            var usersFolder = Path.Combine(dataFolder, ".users");
            Directory.CreateDirectory(usersFolder);
            TryHideFolder(usersFolder);

            var fileName = $"{Environment.MachineName}_{Environment.UserName}.wh";
            _currentUserTrackingFile = Path.Combine(usersFolder, fileName);
            
            File.WriteAllText(_currentUserTrackingFile, DateTime.Now.ToString("O"));
        }
        catch
        {
            // Non-critical
        }
    }

    private static void CleanupUserTracking()
    {
        try
        {
            if (_currentUserTrackingFile != null && File.Exists(_currentUserTrackingFile))
            {
                File.Delete(_currentUserTrackingFile);
            }
        }
        catch
        {
            // Non-critical
        }
    }

    private static void TryCreateLaunchBackup(string dbPath, string backupsFolder)
    {
        if (!File.Exists(dbPath))
        {
            return;
        }

        // Keep 1 backup per hour or just use full timestamp for "every launch"
        var backupName = $"app-{DateTime.Now:yyyyMMdd-HHmmss}.db";
        var backupPath = Path.Combine(backupsFolder, backupName);
        
        // Ensure no collision (unlikely but safe)
        if (File.Exists(backupPath))
        {
            return;
        }

        try
        {
            using var connection = new SqliteConnection(BuildConnectionString(dbPath));
            connection.Open();
            using var command = connection.CreateCommand();
            command.CommandText = $"VACUUM INTO '{EscapeSqlitePath(backupPath)}';";
            command.ExecuteNonQuery();

            // Keep only last 50 backups to prevent bloat
            CleanupOldBackups(backupsFolder);
        }
        catch (Exception ex)
        {
            // Best effort backup
            Console.WriteLine($"Backup failed: {ex.Message}");
        }
    }

    private static void CleanupOldBackups(string backupsFolder)
    {
        try
        {
            var files = Directory.GetFiles(backupsFolder, "app-*.db")
                .Select(f => new FileInfo(f))
                .OrderByDescending(f => f.CreationTime)
                .Skip(50)
                .ToList();

            foreach (var file in files)
            {
                file.Delete();
            }
        }
        catch
        {
            // Non-critical
        }
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

