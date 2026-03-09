using System.ComponentModel.DataAnnotations;

namespace GoldenLine.Desktop.Models
{
    public class User
    {
        [Key]
        public int UserID { get; set; }
        
        [Required]
        [StringLength(50)]
        public string KullaniciAdi { get; set; } = null!;
        
        [Required]
        public string SifreHash { get; set; } = null!; // Hashed password
        
        [StringLength(20)]
        public string Rol { get; set; } = null!; // e.g., "Admin", "User"
    }
}


