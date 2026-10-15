using Microsoft.AspNetCore.Mvc;
using UniMind.Application.Common.Interfaces;
using UniMind.Application.Common.Models;

namespace UniMind.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadController : ControllerBase
{
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IApplicationDbContext _context;

    public UploadController(ICloudinaryService cloudinaryService, IApplicationDbContext context)
    {
        _cloudinaryService = cloudinaryService;
        _context = context;
    }

    /// <summary>
    /// API Tải lên ảnh đại diện (Avatar) lưu trữ trên Cloudinary
    /// </summary>
    [HttpPost("avatar")]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file, [FromQuery] Guid? userId = null)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(Result.Fail("Vui lòng chọn tập tin hình ảnh hợp lệ", "INVALID_FILE"));
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(Result.Fail("Dung lượng ảnh không được vượt quá 5MB", "FILE_TOO_LARGE"));
        }

        try
        {
            // Nếu có userId, kiểm tra và xóa avatar cũ trên Cloudinary để tiết kiệm dung lượng
            if (userId.HasValue)
            {
                var user = _context.Users.FirstOrDefault(u => u.Id == userId.Value);
                if (user != null && !string.IsNullOrEmpty(user.AvatarUrl) && user.AvatarUrl.Contains("cloudinary.com"))
                {
                    await _cloudinaryService.DeleteImageByUrlAsync(user.AvatarUrl);
                }
            }

            using var stream = file.OpenReadStream();
            var secureUrl = await _cloudinaryService.UploadUserImageAsync(stream, file.FileName, "avatars");

            if (userId.HasValue)
            {
                var user = _context.Users.FirstOrDefault(u => u.Id == userId.Value);
                if (user != null)
                {
                    user.AvatarUrl = secureUrl;
                    user.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(Result<string>.Ok(secureUrl, "Tải ảnh đại diện lên Cloudinary thành công"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, Result.Fail($"Lỗi khi tải ảnh lên Cloudinary: {ex.Message}", "CLOUDINARY_ERROR"));
        }
    }

    /// <summary>
    /// API Tải lên hình ảnh đính kèm bài viết cộng đồng lên Cloudinary
    /// </summary>
    [HttpPost("post-image")]
    public async Task<IActionResult> UploadPostImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(Result.Fail("Vui lòng chọn tập tin hình ảnh hợp lệ", "INVALID_FILE"));
        }

        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest(Result.Fail("Dung lượng ảnh bài viết không được vượt quá 10MB", "FILE_TOO_LARGE"));
        }

        try
        {
            using var stream = file.OpenReadStream();
            var secureUrl = await _cloudinaryService.UploadPostImageAsync(stream, file.FileName);
            return Ok(Result<string>.Ok(secureUrl, "Tải ảnh bài viết lên Cloudinary thành công"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, Result.Fail($"Lỗi khi tải ảnh lên Cloudinary: {ex.Message}", "CLOUDINARY_ERROR"));
        }
    }

    /// <summary>
    /// API Xóa hình ảnh trên Cloudinary bằng URL
    /// </summary>
    [HttpDelete("image")]
    public async Task<IActionResult> DeleteImage([FromQuery] string url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return BadRequest(Result.Fail("Đường dẫn URL hình ảnh không được để trống", "INVALID_URL"));
        }

        try
        {
            var success = await _cloudinaryService.DeleteImageByUrlAsync(url);
            if (success)
            {
                return Ok(Result.Ok("Đã xóa ảnh trên Cloudinary thành công"));
            }
            return BadRequest(Result.Fail("Không thể xóa ảnh hoặc ảnh không tồn tại trên Cloudinary", "DELETE_FAILED"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, Result.Fail($"Lỗi khi xóa ảnh trên Cloudinary: {ex.Message}", "CLOUDINARY_ERROR"));
        }
    }
}
