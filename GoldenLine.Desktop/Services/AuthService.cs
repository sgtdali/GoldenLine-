using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;
using BCryptNet = BCrypt.Net.BCrypt;

namespace GoldenLine.Desktop.Services;

public class AuthService
{
    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        "Admin",
        "User",
        "ToolUser",
        "GoldenLineUser"
    };

    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public AuthService()
        : this(App.DbOptions)
    {
    }

    public AuthService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.KullaniciAdi) ||
            string.IsNullOrWhiteSpace(request.Sifre))
        {
            throw new InvalidOperationException("Kullanici adi ve sifre zorunludur.");
        }

        await using var context = new AppDbContext(_dbOptions);

        var user = await context.Users.FirstOrDefaultAsync(u => u.KullaniciAdi == request.KullaniciAdi);
        if (user == null || !BCryptNet.Verify(request.Sifre, user.SifreHash))
        {
            throw new InvalidOperationException("Gecersiz kullanici adi veya sifre.");
        }

        return new AuthResponse
        {
            Token = BuildDesktopToken(user),
            KullaniciAdi = user.KullaniciAdi,
            UserID = user.UserID,
            Role = user.Rol
        };
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.KullaniciAdi) ||
            string.IsNullOrWhiteSpace(request.Sifre))
        {
            throw new InvalidOperationException("Kullanici adi ve sifre zorunludur.");
        }

        await using var context = new AppDbContext(_dbOptions);

        var exists = await context.Users.AnyAsync(u => u.KullaniciAdi == request.KullaniciAdi);
        if (exists)
        {
            throw new InvalidOperationException("Kullanici adi zaten alinmis.");
        }

        var newUser = new User
        {
            KullaniciAdi = request.KullaniciAdi.Trim(),
            SifreHash = BCryptNet.HashPassword(request.Sifre),
            Rol = "User"
        };

        context.Users.Add(newUser);
        await context.SaveChangesAsync();

        return new AuthResponse
        {
            Token = BuildDesktopToken(newUser),
            KullaniciAdi = newUser.KullaniciAdi,
            UserID = newUser.UserID,
            Role = newUser.Rol
        };
    }

    public async Task<List<UserSummaryDto>> GetUsersAsync()
    {
        await using var context = new AppDbContext(_dbOptions);

        return await context.Users
            .AsNoTracking()
            .OrderBy(u => u.KullaniciAdi)
            .Select(u => new UserSummaryDto
            {
                UserID = u.UserID,
                KullaniciAdi = u.KullaniciAdi,
                Rol = u.Rol
            })
            .ToListAsync();
    }

    public async Task DeleteUserAsync(int id)
    {
        await using var context = new AppDbContext(_dbOptions);

        var user = await context.Users.FindAsync(id);
        if (user == null)
        {
            throw new InvalidOperationException("Kullanici bulunamadi.");
        }

        context.Users.Remove(user);
        await context.SaveChangesAsync();
    }

    public async Task ResetPasswordAsync(int id, ResetUserPasswordRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.YeniSifre))
        {
            throw new InvalidOperationException("Yeni sifre bos olamaz.");
        }

        await using var context = new AppDbContext(_dbOptions);

        var user = await context.Users.FindAsync(id);
        if (user == null)
        {
            throw new InvalidOperationException("Kullanici bulunamadi.");
        }

        user.SifreHash = BCryptNet.HashPassword(request.YeniSifre);
        await context.SaveChangesAsync();
    }

    public async Task UpdateRoleAsync(int id, UpdateUserRoleRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Rol))
        {
            throw new InvalidOperationException("Rol bos olamaz.");
        }

        if (!AllowedRoles.Contains(request.Rol))
        {
            throw new InvalidOperationException("Gecersiz rol.");
        }

        await using var context = new AppDbContext(_dbOptions);

        var user = await context.Users.FindAsync(id);
        if (user == null)
        {
            throw new InvalidOperationException("Kullanici bulunamadi.");
        }

        var normalizedRole = AllowedRoles.First(role =>
            role.Equals(request.Rol, StringComparison.OrdinalIgnoreCase));

        user.Rol = normalizedRole;
        await context.SaveChangesAsync();
    }

    private static string BuildDesktopToken(User user)
    {
        var header = Base64UrlEncode(JsonSerializer.Serialize(new
        {
            alg = "none",
            typ = "JWT"
        }));

        var payload = Base64UrlEncode(JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["sub"] = user.KullaniciAdi,
            ["nameid"] = user.UserID,
            ["role"] = user.Rol,
            ["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] = user.Rol,
            ["exp"] = DateTimeOffset.UtcNow.AddDays(1).ToUnixTimeSeconds()
        }));

        return $"{header}.{payload}.desktop";
    }

    private static string Base64UrlEncode(string value)
    {
        var bytes = Encoding.UTF8.GetBytes(value);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}

public class LoginRequest
{
    public string KullaniciAdi { get; set; } = string.Empty;
    public string Sifre { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string KullaniciAdi { get; set; } = string.Empty;
    public string Sifre { get; set; } = string.Empty;
}

public class UserSummaryDto
{
    public int UserID { get; set; }
    public string KullaniciAdi { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
}

public class UpdateUserRoleRequest
{
    public string Rol { get; set; } = string.Empty;
}

public class ResetUserPasswordRequest
{
    public string YeniSifre { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string KullaniciAdi { get; set; } = string.Empty;
    public int UserID { get; set; }
    public string Role { get; set; } = string.Empty;
}

