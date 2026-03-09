using System;
using System.IO;
using System.Windows;
using Microsoft.Web.WebView2.Core;
using GoldenLine.Desktop.Bridge;

namespace GoldenLine.Desktop;

public partial class MainWindow : Window
{
    private readonly BridgeService _bridgeService;
    private static readonly string LogPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "GoldenLine",
        "logs",
        "webview.log");

    public MainWindow()
    {
        try
        {
            InitializeComponent();

            _bridgeService = new BridgeService();
            Loaded += MainWindow_Loaded;
        }
        catch (Exception ex)
        {
            MessageBox.Show($"MainWindow HatasÄ±:\n{ex.Message}\n\nStack Trace:\n{ex.StackTrace}", 
                "GoldenLine Kritik Hata", MessageBoxButton.OK, MessageBoxImage.Error);
            throw;
        }
    }

    private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        await WebView.EnsureCoreWebView2Async();

        WebView.CoreWebView2.AddHostObjectToScript("backend", _bridgeService);
        WebView.CoreWebView2.NavigationCompleted += (_, args) =>
        {
            if (!args.IsSuccess)
            {
                Log($"Navigation failed: {args.WebErrorStatus}");
            }
        };
        WebView.CoreWebView2.ProcessFailed += (_, args) =>
        {
            Log($"Process failed: {args.ProcessFailedKind}");
        };
        WebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
            "appmedia",
            App.MediaRoot,
            CoreWebView2HostResourceAccessKind.Allow);

#if DEBUG
        WebView.Source = new Uri("http://localhost:3000");
#else
        var appFolder = Path.Combine(AppContext.BaseDirectory, "web");
        Log($"Base directory: {AppContext.BaseDirectory}");
        Log($"Web folder: {appFolder}");
        Log($"Web folder exists: {Directory.Exists(appFolder)}");
        Log($"Index exists: {File.Exists(Path.Combine(appFolder, "index.html"))}");
        WebView.CoreWebView2.SetVirtualHostNameToFolderMapping(
            "appassets",
            appFolder,
            CoreWebView2HostResourceAccessKind.Allow);
        WebView.Source = new Uri("https://appassets/index.html");
#endif
    }

    private static void Log(string message)
    {
        try
        {
            var logDir = Path.GetDirectoryName(LogPath);
            if (!string.IsNullOrEmpty(logDir))
            {
                Directory.CreateDirectory(logDir);
            }

            File.AppendAllText(LogPath, $"{DateTime.UtcNow:O} {message}{Environment.NewLine}");
        }
        catch
        {
            // Best-effort logging only.
        }
    }
}

