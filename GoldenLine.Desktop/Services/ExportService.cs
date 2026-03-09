using System.Xml.Linq;
using Microsoft.EntityFrameworkCore;
using GoldenLine.Desktop.Data;
using GoldenLine.Desktop.Models;

namespace GoldenLine.Desktop.Services;

public class ExportService
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;

    public ExportService()
        : this(App.DbOptions)
    {
    }

    public ExportService(DbContextOptions<AppDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    public async Task<ExportFileResult> ExportToMsProjectAsync(int projectId)
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

        XNamespace ns = "http://schemas.microsoft.com/project/2003/addins/new";
        var xDoc = new XDocument(
            new XElement(ns + "Project",
                new XElement(ns + "Tasks",
                    new XElement(ns + "Task",
                        new XElement(ns + "UID", "1"),
                        new XElement(ns + "ID", "1"),
                        new XElement(ns + "Name", project.ProjeAdi),
                        new XElement(ns + "Type", "1"),
                        new XElement(ns + "IsNull", "0")
                    ),
                    project.Nodes.Select((node, index) =>
                        new XElement(ns + "Task",
                            new XElement(ns + "UID", (index + 2).ToString()),
                            new XElement(ns + "ID", (index + 2).ToString()),
                            new XElement(ns + "Name", node.NodeAdi),
                            new XElement(ns + "Type", "0"),
                            new XElement(ns + "IsNull", "0"),
                            new XElement(ns + "Text1", node.NodeID)
                        )
                    )
                ),
                new XElement(ns + "PredecessorLink",
                    project.Edges.Select((edge, index) =>
                    {
                        var sourceNode = project.Nodes.FirstOrDefault(n => n.NodeID == edge.KaynakNodeID);
                        var targetNode = project.Nodes.FirstOrDefault(n => n.NodeID == edge.HedefNodeID);

                        if (sourceNode == null || targetNode == null)
                        {
                            return null;
                        }

                        var sourceNodeUID = project.Nodes.ToList().IndexOf(sourceNode) + 2;
                        var targetNodeUID = project.Nodes.ToList().IndexOf(targetNode) + 2;

                        return new XElement(ns + "Link",
                            new XElement(ns + "LinkID", (index + 1).ToString()),
                            new XElement(ns + "PredecessorUID", sourceNodeUID.ToString()),
                            new XElement(ns + "SuccessorUID", targetNodeUID.ToString()),
                            new XElement(ns + "Type", "1")
                        );
                    }).Where(x => x != null)
                )
            )
        );

        return new ExportFileResult
        {
            FileName = $"{project.ProjeAdi}.xml",
            Content = xDoc.ToString()
        };
    }
}

public class ExportFileResult
{
    public string FileName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

