using System.Xml.Linq;
using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class ImportService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public ImportService()
        : this(App.DbOptions)
    {
    }

    public ImportService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<ImportResult> ImportFromMsProjectAsync(int projectId, string xmlContent)
    {
        if (string.IsNullOrWhiteSpace(xmlContent))
        {
            throw new InvalidOperationException("XML content is required.");
        }

        await using var context = new AppDbContext(_dbOptions);

        var project = await context.Projects
            .Include(p => p.Nodes)
            .Include(p => p.Edges)
            .FirstOrDefaultAsync(p => p.ProjeID == projectId);

        if (project == null)
        {
            throw new InvalidOperationException("Project not found.");
        }

        XDocument xDoc;
        try
        {
            xDoc = XDocument.Parse(xmlContent);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Invalid XML content: {ex.Message}");
        }

        var rootNs = xDoc.Root?.Name.Namespace ?? XNamespace.None;

        var xmlTasks = xDoc.Descendants(rootNs + "Task")
            .Where(t => (string?)t.Element(rootNs + "Type") == "0" && (string?)t.Element(rootNs + "IsNull") == "0")
            .ToList();

        var newNodes = new List<Node>();
        var uidToNodeIdMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        var rng = new Random();
        foreach (var task in xmlTasks)
        {
            var xmlUID = (string?)task.Element(rootNs + "UID") ?? string.Empty;
            var xmlText1 = (string?)task.Element(rootNs + "Text1") ?? string.Empty;

            var newNodeId = !string.IsNullOrEmpty(xmlText1) ? xmlText1 : $"node_{Guid.NewGuid()}";

            newNodes.Add(new Node
            {
                NodeID = newNodeId,
                ProjeID = projectId,
                NodeAdi = (string?)task.Element(rootNs + "Name") ?? "Unnamed Task",
                Tip = "custom",
                X_Pozisyonu = rng.Next(100, 800),
                Y_Pozisyonu = rng.Next(100, 600)
            });

            if (!string.IsNullOrEmpty(xmlUID))
            {
                uidToNodeIdMap[xmlUID] = newNodeId;
            }
        }

        var xmlLinks = xDoc.Descendants(rootNs + "PredecessorLink").Descendants(rootNs + "Link").ToList();
        var newEdges = new List<Edge>();

        foreach (var link in xmlLinks)
        {
            var sourceUID = (string?)link.Element(rootNs + "PredecessorUID") ?? string.Empty;
            var targetUID = (string?)link.Element(rootNs + "SuccessorUID") ?? string.Empty;

            if (uidToNodeIdMap.TryGetValue(sourceUID, out var sourceNodeId) &&
                uidToNodeIdMap.TryGetValue(targetUID, out var targetNodeId))
            {
                newEdges.Add(new Edge
                {
                    EdgeID = $"edge_{Guid.NewGuid()}",
                    ProjeID = projectId,
                    KaynakNodeID = sourceNodeId,
                    HedefNodeID = targetNodeId
                });
            }
        }

        await using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            context.Nodes.RemoveRange(project.Nodes);
            context.Edges.RemoveRange(project.Edges);
            await context.SaveChangesAsync();

            await context.Nodes.AddRangeAsync(newNodes);
            await context.Edges.AddRangeAsync(newEdges);
            await context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return new ImportResult
        {
            Nodes = newNodes,
            Edges = newEdges
        };
    }
}

public class ImportResult
{
    public List<Node> Nodes { get; set; } = new();
    public List<Edge> Edges { get; set; } = new();
}

