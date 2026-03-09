using System;
using System.Diagnostics;
using System.IO;

namespace GoldenLine.Launcher;

internal static class Program
{
    private const string MasterPath = @"\\sunucu\Data\REPKON_ORTAK\Ortak\Tayfun_Vural\GoldenLine\bin";
    private const string AppExeName = "GoldenLine.Desktop.exe";
    private static readonly string LocalPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "GoldenLine",
        "app");

    private static int Main()
    {
        Console.WriteLine("Checking for updates...");

        try
        {
            SyncFiles(MasterPath, LocalPath);

            var exePath = Path.Combine(LocalPath, AppExeName);
            if (!File.Exists(exePath))
            {
                Console.WriteLine($"Unable to find {AppExeName} in {LocalPath}.");
                return 1;
            }

            var startInfo = new ProcessStartInfo(exePath)
            {
                WorkingDirectory = LocalPath,
                UseShellExecute = true
            };

            Process.Start(startInfo);
            return 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Launcher error: {ex.Message}");
            return 1;
        }
    }

    private static void SyncFiles(string masterPath, string localPath)
    {
        if (!Directory.Exists(masterPath))
        {
            throw new DirectoryNotFoundException($"Master path not found: {masterPath}");
        }

        Directory.CreateDirectory(localPath);

        foreach (var masterFilePath in Directory.GetFiles(masterPath, "*", SearchOption.AllDirectories))
        {
            var relativePath = Path.GetRelativePath(masterPath, masterFilePath);
            var localFilePath = Path.Combine(localPath, relativePath);
            var localDir = Path.GetDirectoryName(localFilePath);
            if (!string.IsNullOrEmpty(localDir))
            {
                Directory.CreateDirectory(localDir);
            }

            var masterInfo = new FileInfo(masterFilePath);
            var shouldCopy = true;
            if (File.Exists(localFilePath))
            {
                var localInfo = new FileInfo(localFilePath);
                if (masterInfo.LastWriteTimeUtc <= localInfo.LastWriteTimeUtc)
                {
                    shouldCopy = false;
                }
            }

            if (shouldCopy)
            {
                masterInfo.CopyTo(localFilePath, true);
                File.SetLastWriteTimeUtc(localFilePath, masterInfo.LastWriteTimeUtc);
            }
        }
    }
}

