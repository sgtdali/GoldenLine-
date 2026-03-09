using System.IO;
using System.Text;

namespace GoldenLine.Desktop.Services;

public class MediaService
{
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private const string ShipmentPhotosRoot = @"\\sunucu\Data\REPKON_ORTAK\Ortak\Tayfun_Vural\GoldenLine\Shipment_Photos";
    private readonly string _mediaRoot;

    public MediaService()
        : this(GetDefaultMediaRoot())
    {
    }

    public MediaService(string mediaRoot)
    {
        _mediaRoot = mediaRoot;
    }

    public async Task<NodeImageUploadResponse> UploadNodeImageAsync(NodeImageUploadRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.FileName))
        {
            throw new InvalidOperationException("File name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Base64Data))
        {
            throw new InvalidOperationException("File payload is required.");
        }

        var extension = Path.GetExtension(request.FileName);
        if (string.IsNullOrWhiteSpace(extension) ||
            !AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Unsupported file format.");
        }

        var nodeUploadsFolder = Path.Combine(_mediaRoot, "uploads", "nodes");
        Directory.CreateDirectory(nodeUploadsFolder);

        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var filePath = Path.Combine(nodeUploadsFolder, fileName);

        var bytes = DecodeBase64(request.Base64Data);
        await File.WriteAllBytesAsync(filePath, bytes);

        var relativePath = $"/uploads/nodes/{fileName}";
        return new NodeImageUploadResponse
        {
            RelativePath = relativePath,
            Url = $"https://appmedia{relativePath}"
        };
    }

    public async Task<ShipmentCratePhotoUploadResponse> UploadShipmentCratePhotosAsync(
        ShipmentCratePhotoUploadRequest request)
    {
        if (request == null)
        {
            throw new InvalidOperationException("Request payload is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ProjectName))
        {
            throw new InvalidOperationException("Project name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.CrateName))
        {
            throw new InvalidOperationException("Crate name is required.");
        }

        if (request.Files == null || request.Files.Count == 0)
        {
            throw new InvalidOperationException("At least one photo is required.");
        }

        var projectFolder = SanitizePathSegment(request.ProjectName);
        var crateBase = NormalizeCrateBaseName(request.CrateName);

        var targetFolder = Path.Combine(ShipmentPhotosRoot, projectFolder);
        Directory.CreateDirectory(targetFolder);

        var nextIndex = GetNextPhotoIndex(targetFolder, crateBase);
        var savedFiles = new List<string>();

        foreach (var file in request.Files)
        {
            if (string.IsNullOrWhiteSpace(file.FileName))
            {
                throw new InvalidOperationException("File name is required.");
            }

            if (string.IsNullOrWhiteSpace(file.Base64Data))
            {
                throw new InvalidOperationException("File payload is required.");
            }

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(extension) ||
                !AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Unsupported file format.");
            }

            string fileName;
            string filePath;
            do
            {
                fileName = $"{crateBase}_Photo{nextIndex:00}{extension.ToLowerInvariant()}";
                filePath = Path.Combine(targetFolder, fileName);
                nextIndex++;
            } while (File.Exists(filePath));

            var bytes = DecodeBase64(file.Base64Data);
            await File.WriteAllBytesAsync(filePath, bytes);
            savedFiles.Add(fileName);
        }

        return new ShipmentCratePhotoUploadResponse
        {
            FolderPath = targetFolder,
            FileNames = savedFiles
        };
    }

    public ShipmentCratePhotoDeleteResponse DeleteShipmentCratePhotos(ShipmentCratePhotoDeleteRequest request)
    {
        if (request == null)
        {
            throw new InvalidOperationException("Request payload is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ProjectName))
        {
            throw new InvalidOperationException("Project name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.CrateName))
        {
            throw new InvalidOperationException("Crate name is required.");
        }

        var projectFolder = SanitizePathSegment(request.ProjectName);
        var crateBase = NormalizeCrateBaseName(request.CrateName);
        var targetFolder = Path.Combine(ShipmentPhotosRoot, projectFolder);

        if (!Directory.Exists(targetFolder))
        {
            return new ShipmentCratePhotoDeleteResponse
            {
                DeletedCount = 0
            };
        }

        var deletedCount = 0;
        foreach (var path in Directory.EnumerateFiles(targetFolder, $"{crateBase}_Photo*.*"))
        {
            File.Delete(path);
            deletedCount++;
        }

        return new ShipmentCratePhotoDeleteResponse
        {
            DeletedCount = deletedCount
        };
    }

    public ShipmentCratePhotoFetchResponse GetShipmentCratePhoto(ShipmentCratePhotoFetchRequest request)
    {
        if (request == null)
        {
            throw new InvalidOperationException("Request payload is required.");
        }

        if (string.IsNullOrWhiteSpace(request.ProjectName))
        {
            throw new InvalidOperationException("Project name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.CrateName))
        {
            throw new InvalidOperationException("Crate name is required.");
        }

        var projectFolder = SanitizePathSegment(request.ProjectName);
        var crateBase = NormalizeCrateBaseName(request.CrateName);
        var targetFolder = Path.Combine(ShipmentPhotosRoot, projectFolder);

        if (!Directory.Exists(targetFolder))
        {
            return new ShipmentCratePhotoFetchResponse();
        }

        var files = Directory.EnumerateFiles(targetFolder, $"{crateBase}_Photo*.*")
            .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (files.Count == 0)
        {
            return new ShipmentCratePhotoFetchResponse();
        }

        var selected = files[0];
        var extension = Path.GetExtension(selected).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
        {
            return new ShipmentCratePhotoFetchResponse();
        }

        var bytes = File.ReadAllBytes(selected);
        return new ShipmentCratePhotoFetchResponse
        {
            FileName = Path.GetFileName(selected),
            Base64Data = Convert.ToBase64String(bytes),
            ContentType = ResolveContentType(extension)
        };
    }

    public static string GetDefaultMediaRoot()
    {
        var baseFolder = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        return Path.Combine(baseFolder, "GoldenLine", "media");
    }

    private static byte[] DecodeBase64(string base64Data)
    {
        var trimmed = base64Data.Trim();
        var commaIndex = trimmed.IndexOf(',');
        if (commaIndex >= 0)
        {
            trimmed = trimmed[(commaIndex + 1)..];
        }

        return Convert.FromBase64String(trimmed);
    }

    private static string SanitizePathSegment(string value)
    {
        var trimmed = value.Trim();
        if (trimmed.Length == 0)
        {
            throw new InvalidOperationException("Path segment cannot be empty.");
        }

        var invalid = Path.GetInvalidFileNameChars();
        var sb = new StringBuilder(trimmed.Length);
        foreach (var ch in trimmed)
        {
            sb.Append(invalid.Contains(ch) ? '_' : ch);
        }

        return sb.ToString().Trim().TrimEnd('.');
    }

    private static string NormalizeCrateBaseName(string crateName)
    {
        var sanitized = SanitizePathSegment(crateName);
        var collapsed = sanitized.Replace(" ", string.Empty);
        return string.IsNullOrWhiteSpace(collapsed) ? "Kasa" : collapsed;
    }

    private static int GetNextPhotoIndex(string directory, string crateBase)
    {
        if (!Directory.Exists(directory))
        {
            return 1;
        }

        var prefix = $"{crateBase}_Photo";
        var maxIndex = 0;

        foreach (var path in Directory.EnumerateFiles(directory, $"{crateBase}_Photo*.*"))
        {
            var name = Path.GetFileNameWithoutExtension(path);
            if (!name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var suffix = name.Substring(prefix.Length);
            if (int.TryParse(suffix, out var parsed))
            {
                maxIndex = Math.Max(maxIndex, parsed);
            }
        }

        return maxIndex + 1;
    }

    private static string ResolveContentType(string extension)
    {
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };
    }
}

public class NodeImageUploadRequest
{
    public string FileName { get; set; } = string.Empty;
    public string Base64Data { get; set; } = string.Empty;
}

public class NodeImageUploadResponse
{
    public string Url { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
}

public class ShipmentCratePhotoUploadRequest
{
    public string ProjectName { get; set; } = string.Empty;
    public string CrateName { get; set; } = string.Empty;
    public List<ShipmentCratePhotoFile> Files { get; set; } = new();
}

public class ShipmentCratePhotoFile
{
    public string FileName { get; set; } = string.Empty;
    public string Base64Data { get; set; } = string.Empty;
}

public class ShipmentCratePhotoUploadResponse
{
    public string FolderPath { get; set; } = string.Empty;
    public List<string> FileNames { get; set; } = new();
}

public class ShipmentCratePhotoDeleteRequest
{
    public string ProjectName { get; set; } = string.Empty;
    public string CrateName { get; set; } = string.Empty;
}

public class ShipmentCratePhotoDeleteResponse
{
    public int DeletedCount { get; set; }
}

public class ShipmentCratePhotoFetchRequest
{
    public string ProjectName { get; set; } = string.Empty;
    public string CrateName { get; set; } = string.Empty;
}

public class ShipmentCratePhotoFetchResponse
{
    public string FileName { get; set; } = string.Empty;
    public string Base64Data { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
}

