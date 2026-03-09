using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GoldenLine.Desktop.Models
{
    public class EquipmentItem
    {
        [Key]
        public int EquipmentItemID { get; set; }

        [Required]
        [MaxLength(50)]
        public string KalemNo { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string KalemTanim { get; set; } = null!;

        [Required]
        [MaxLength(200)]
        public string OlcuAciklama { get; set; } = null!;

        [MaxLength(100)]
        public string? UreticiKodu { get; set; }

        [MaxLength(100)]
        public string? UreticiKodu2 { get; set; }

        [MaxLength(100)]
        public string? Tedarikci { get; set; }

        [MaxLength(100)]
        public string? AnaGrup { get; set; }

        [MaxLength(100)]
        public string? AraGrup { get; set; }

        [MaxLength(120)]
        public string? AltGrup { get; set; }

        public int? SupplierId { get; set; }

        public Supplier? Supplier { get; set; }

        [MaxLength(60)]
        public string Durum { get; set; } = "aktif";

        [MaxLength(120)]
        public string? Lokasyon { get; set; }

        public int Stok { get; set; }

        public int AssignedQuantity { get; set; }

        public int? MinStock { get; set; }

        public bool IsCalibrationRequired { get; set; }

        public DateTime? LastCalibrationDate { get; set; }

        public int? CalibrationIntervalDays { get; set; }

        public DateTime? SonKullanimTarihi { get; set; }

        public DateTime? SayimTarihi { get; set; }

        [Precision(18, 2)]
        public decimal? Fiyat { get; set; }

        [NotMapped]
        public CalibrationStatus CalibrationStatus { get; set; } = CalibrationStatus.NotRequired;

        public ICollection<InventoryAssignment> Assignments { get; set; } = new List<InventoryAssignment>();

        public ICollection<InventoryMovement> Movements { get; set; } = new List<InventoryMovement>();

        public ICollection<ItemLocationStock> LocationStocks { get; set; } = new List<ItemLocationStock>();
    }
}


