using System;

namespace GoldenLine.Desktop.Models;

public class InventorySnapshot
{
    public int Id { get; set; }
    public string PayloadJson { get; set; } = "[]";
    public DateTime UpdatedUtc { get; set; } = DateTime.UtcNow;
}

