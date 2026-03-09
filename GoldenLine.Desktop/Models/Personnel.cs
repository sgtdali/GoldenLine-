using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models
{
    public class Personnel
    {
        public int PersonnelId { get; set; }

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = null!;

        [MaxLength(80)]
        public string? Department { get; set; }

        [MaxLength(120)]
        public string? Role { get; set; }

        [MaxLength(120)]
        public string? TeamOrProject { get; set; }

        [MaxLength(40)]
        public string EmploymentStatus { get; set; } = "Active";

        [MaxLength(200)]
        public string? Skills { get; set; }

        [MaxLength(4000)]
        public string? Notes { get; set; }

        [MaxLength(120)]
        public string? PrimaryLocation { get; set; }

        [MaxLength(120)]
        public string? CurrentProject { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<DailyStatus> DailyStatuses { get; set; } = new List<DailyStatus>();
    }
}


