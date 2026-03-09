using System.Collections.Generic;

namespace GoldenLine.Desktop.Models
{
    public class ItemLocationStockSnapshotDto
    {
        public int LocationId { get; set; }
        public string LocationName { get; set; } = string.Empty;
        public string? LocationCode { get; set; }
        public int QuantityOnHand { get; set; }
    }

    public class ItemStockSnapshotDto
    {
        public int ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? ItemCode { get; set; }
        public int TotalOnHand { get; set; }
        public int TotalAssigned { get; set; }
        public int TotalInSystem { get; set; }
        public int? MinStock { get; set; }
        public bool IsBelowMinStock { get; set; }
        public List<ItemLocationStockSnapshotDto> Locations { get; set; } = new();
    }

    public class StockOverviewSummaryDto
    {
        public int TotalItems { get; set; }
        public int TotalQuantityOnHand { get; set; }
        public int TotalQuantityAssigned { get; set; }
        public int TotalCriticalItems { get; set; }
    }

    public class StockOverviewResultDto
    {
        public StockOverviewSummaryDto Summary { get; set; } = new();
        public List<ItemStockSnapshotDto> Items { get; set; } = new();
    }
}


