using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using UniMind.Application.Common.Interfaces;

namespace UniMind.Infrastructure.ExternalServices.Cloudinary;

public class CloudinaryService : ICloudinaryService
{
    private readonly CloudinaryDotNet.Cloudinary _cloudinary;
    private readonly string _cloudName;

    public CloudinaryService(string? cloudName = null, string? apiKey = null, string? apiSecret = null)
    {
        _cloudName = !string.IsNullOrWhiteSpace(cloudName) ? cloudName : "kh0hrw3c";
        var key = !string.IsNullOrWhiteSpace(apiKey) ? apiKey : "668128831581771";
        var secret = !string.IsNullOrWhiteSpace(apiSecret) ? apiSecret : "ddFKDKsyIeTy9vrflfc69Vjpfys";

        var account = new Account(_cloudName, key, secret);
        _cloudinary = new CloudinaryDotNet.Cloudinary(account);
        _cloudinary.Api.Secure = true; // Luôn dùng giao thức bảo mật HTTPS
    }

    public async Task<string> UploadUserImageAsync(Stream fileStream, string fileName, string folderName = "avatars")
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            Folder = $"unimind_uploads/{folderName}",
            // Tự động căn chỉnh khuôn mặt và nén chất lượng WebP/Auto
            Transformation = new Transformation()
                .Width(500)
                .Height(500)
                .Crop("thumb")
                .Gravity("face")
                .Quality("auto")
                .FetchFormat("auto")
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);
        if (uploadResult.Error != null)
        {
            throw new Exception($"Lỗi tải ảnh lên Cloudinary: {uploadResult.Error.Message}");
        }

        return uploadResult.SecureUrl?.ToString() ?? uploadResult.Url?.ToString() ?? string.Empty;
    }

    public async Task<string> UploadPostImageAsync(Stream fileStream, string fileName)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            Folder = "unimind_uploads/post_images",
            // Giới hạn chiều rộng tối đa 1200px, giữ nguyên tỉ lệ gốc
            Transformation = new Transformation()
                .Width(1200)
                .Crop("limit")
                .Quality("auto")
                .FetchFormat("auto")
        };

        var uploadResult = await _cloudinary.UploadAsync(uploadParams);
        if (uploadResult.Error != null)
        {
            throw new Exception($"Lỗi tải ảnh bài viết lên Cloudinary: {uploadResult.Error.Message}");
        }

        return uploadResult.SecureUrl?.ToString() ?? uploadResult.Url?.ToString() ?? string.Empty;
    }

    public async Task<bool> DeleteImageByUrlAsync(string imageUrl)
    {
        var publicId = ExtractPublicIdFromUrl(imageUrl);
        if (string.IsNullOrEmpty(publicId)) return false;

        var deleteParams = new DeletionParams(publicId);
        var result = await _cloudinary.DestroyAsync(deleteParams);
        return result.Result == "ok";
    }

    private static string? ExtractPublicIdFromUrl(string url)
    {
        try
        {
            var uri = new Uri(url);
            var path = uri.AbsolutePath;
            var uploadIndex = path.IndexOf("/upload/", StringComparison.Ordinal);
            if (uploadIndex < 0) return null;

            var afterUpload = path.Substring(uploadIndex + "/upload/".Length);
            // Bỏ qua version prefix v12345678/ nếu có
            if (afterUpload.StartsWith("v") && afterUpload.IndexOf('/') > 0)
            {
                afterUpload = afterUpload.Substring(afterUpload.IndexOf('/') + 1);
            }

            var lastDot = afterUpload.LastIndexOf('.');
            return lastDot > 0 ? afterUpload.Substring(0, lastDot) : afterUpload;
        }
        catch
        {
            return null;
        }
    }
}
