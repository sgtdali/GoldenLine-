using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class ProjectService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public ProjectService()
        : this(App.DbOptions)
    {
    }

    public ProjectService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<List<Project>> GetProjectsAsync()
    {
        await using var context = new AppDbContext(_dbOptions);
        return await context.Projects.ToListAsync();
    }

    public async Task<Project> CreateProjectAsync(ProjectCreateRequest request, string? actor = null)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ProjeAdi))
        {
            throw new InvalidOperationException("Project name is required.");
        }

        await using var context = new AppDbContext(_dbOptions);

        var now = DateTime.UtcNow;
        var username = string.IsNullOrWhiteSpace(actor) ? Environment.UserName : actor.Trim();

        var normalizedType = request.ProjectType?.Trim().ToLowerInvariant();
        if (normalizedType != "line" && normalizedType != "machine")
        {
            normalizedType = "machine";
        }

        var newProject = new Project
        {
            ProjeAdi = request.ProjeAdi,
            OlusturmaTarihi = now,
            OlusturanKullanici = username,
            SonDuzenlemeTarihi = now,
            SonDuzenleyenKullanici = username,
            ProjectType = normalizedType,
            ParentProjectId = normalizedType == "machine" ? request.ParentProjectId : null,
        };

        context.Projects.Add(newProject);
        await context.SaveChangesAsync();

        return newProject;
    }

    public async Task<Project?> GetProjectAsync(int id)
    {
        await using var context = new AppDbContext(_dbOptions);
        return await context.Projects.FindAsync(id);
    }

    public async Task DeleteProjectAsync(int id)
    {
        await using var context = new AppDbContext(_dbOptions);

        var project = await context.Projects.FindAsync(id);
        if (project == null)
        {
            throw new InvalidOperationException("Project not found.");
        }

        var relatedNodes = await context.Nodes.Where(n => n.ProjeID == id).ToListAsync();
        context.Nodes.RemoveRange(relatedNodes);

        var relatedEdges = await context.Edges.Where(e => e.ProjeID == id).ToListAsync();
        context.Edges.RemoveRange(relatedEdges);

        context.Projects.Remove(project);
        await context.SaveChangesAsync();
    }
}

public class ProjectCreateRequest
{
    public string ProjeAdi { get; set; } = string.Empty;
    public string? ProjectType { get; set; }
    public int? ParentProjectId { get; set; }
}

