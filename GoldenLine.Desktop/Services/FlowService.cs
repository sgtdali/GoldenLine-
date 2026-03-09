using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class FlowService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public FlowService()
        : this(App.DbOptions)
    {
    }

    public FlowService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<FlowDataDto> GetFlowAsync(int projectId, string? parentNodeId)
    {
        await using var context = new AppDbContext(_dbOptions);

        var projectExists = await context.Projects.AnyAsync(p => p.ProjeID == projectId);
        if (!projectExists)
        {
            throw new InvalidOperationException("Project not found.");
        }

        var normalizedParentId = string.IsNullOrWhiteSpace(parentNodeId)
            ? null
            : parentNodeId;

        List<Node> nodes;
        if (normalizedParentId is null)
        {
            nodes = await context.Nodes
                .Where(n => n.ProjeID == projectId)
                .ToListAsync();
        }
        else
        {
            nodes = await context.Nodes
                .Where(n => n.ProjeID == projectId && n.ParentNodeId == normalizedParentId)
                .ToListAsync();
        }

        var nodeIds = nodes.Select(n => n.NodeID).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var edges = await context.Edges
            .Where(e => e.ProjeID == projectId)
            .ToListAsync();

        edges = edges
            .Where(e => nodeIds.Contains(e.KaynakNodeID) && nodeIds.Contains(e.HedefNodeID))
            .ToList();

        return new FlowDataDto
        {
            Nodes = nodes.Select(n => new NodeDto
            {
                NodeID = n.NodeID,
                Tip = n.Tip,
                NodeAdi = n.NodeAdi,
                X_Pozisyonu = n.X_Pozisyonu,
                Y_Pozisyonu = n.Y_Pozisyonu,
                ParentNodeId = n.ParentNodeId,
                DataJson = n.DataJson
            }).ToList(),
            Edges = edges.Select(e => new EdgeDto
            {
                EdgeID = e.EdgeID,
                KaynakNodeID = e.KaynakNodeID,
                HedefNodeID = e.HedefNodeID,
                DataJson = e.DataJson
            }).ToList()
        };
    }

    public async Task SaveFlowAsync(int projectId, FlowDataDto flowData, string? actor = null)
    {
        await using var context = new AppDbContext(_dbOptions);

        var project = await context.Projects
            .Include(p => p.Nodes)
            .Include(p => p.Edges)
            .FirstOrDefaultAsync(p => p.ProjeID == projectId);

        if (project == null)
        {
            throw new InvalidOperationException("Project not found.");
        }

        var nodeIds = flowData.Nodes.Select(n => n.NodeID).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var edgeIds = flowData.Edges.Select(e => e.EdgeID).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var nodesToDelete = project.Nodes
            .Where(n => !nodeIds.Contains(n.NodeID))
            .ToList();
        context.Nodes.RemoveRange(nodesToDelete);

        foreach (var nodeDto in flowData.Nodes)
        {
            var existingNode = project.Nodes.FirstOrDefault(n => n.NodeID == nodeDto.NodeID);
            if (existingNode != null)
            {
                existingNode.NodeAdi = nodeDto.NodeAdi;
                existingNode.Tip = nodeDto.Tip;
                existingNode.X_Pozisyonu = nodeDto.X_Pozisyonu;
                existingNode.Y_Pozisyonu = nodeDto.Y_Pozisyonu;
                existingNode.ParentNodeId = nodeDto.ParentNodeId;
                existingNode.DataJson = nodeDto.DataJson;
            }
            else
            {
                var newNode = new Node
                {
                    NodeID = nodeDto.NodeID,
                    ProjeID = projectId,
                    Tip = nodeDto.Tip,
                    NodeAdi = nodeDto.NodeAdi,
                    X_Pozisyonu = nodeDto.X_Pozisyonu,
                    Y_Pozisyonu = nodeDto.Y_Pozisyonu,
                    ParentNodeId = nodeDto.ParentNodeId,
                    DataJson = nodeDto.DataJson
                };
                context.Nodes.Add(newNode);
            }
        }

        var edgesToDelete = project.Edges
            .Where(e => !edgeIds.Contains(e.EdgeID))
            .ToList();
        context.Edges.RemoveRange(edgesToDelete);

        foreach (var edgeDto in flowData.Edges)
        {
            var existingEdge = project.Edges.FirstOrDefault(e => e.EdgeID == edgeDto.EdgeID);
            if (existingEdge != null)
            {
                existingEdge.KaynakNodeID = edgeDto.KaynakNodeID;
                existingEdge.HedefNodeID = edgeDto.HedefNodeID;
                existingEdge.DataJson = edgeDto.DataJson;
            }
            else
            {
                var newEdge = new Edge
                {
                    EdgeID = edgeDto.EdgeID,
                    ProjeID = projectId,
                    KaynakNodeID = edgeDto.KaynakNodeID,
                    HedefNodeID = edgeDto.HedefNodeID,
                    DataJson = edgeDto.DataJson
                };
                context.Edges.Add(newEdge);
            }
        }

        var username = string.IsNullOrWhiteSpace(actor) ? Environment.UserName : actor.Trim();
        project.SonDuzenlemeTarihi = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(username))
        {
            project.SonDuzenleyenKullanici = username;
            if (string.IsNullOrWhiteSpace(project.OlusturanKullanici))
            {
                project.OlusturanKullanici = username;
            }
        }

        await context.SaveChangesAsync();
    }
}

public class NodeDto
{
    public string NodeID { get; set; } = string.Empty;
    public string Tip { get; set; } = string.Empty;
    public string NodeAdi { get; set; } = string.Empty;
    public decimal X_Pozisyonu { get; set; }
    public decimal Y_Pozisyonu { get; set; }
    public string? ParentNodeId { get; set; }
    public string? DataJson { get; set; }
}

public class EdgeDto
{
    public string EdgeID { get; set; } = string.Empty;
    public string KaynakNodeID { get; set; } = string.Empty;
    public string HedefNodeID { get; set; } = string.Empty;
    public string? DataJson { get; set; }
}

public class FlowDataDto
{
    public List<NodeDto> Nodes { get; set; } = new();
    public List<EdgeDto> Edges { get; set; } = new();
}

