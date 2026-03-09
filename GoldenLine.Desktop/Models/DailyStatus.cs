using System;
using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models
{
    public class DailyStatus
    {
        public int DailyStatusId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public int PersonnelId { get; set; }

        public Personnel Personnel { get; set; } = null!;

        [Required]
        public PersonnelStatusType StatusType { get; set; }

        [MaxLength(120)]
        public string? ProjectCode { get; set; }

        [MaxLength(200)]
        public string? ProjectName { get; set; }

        [MaxLength(120)]
        public string? Location { get; set; }

        [MaxLength(1000)]
        public string? Note { get; set; }

        [MaxLength(100)]
        public string? CreatedBy { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(100)]
        public string? UpdatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}


