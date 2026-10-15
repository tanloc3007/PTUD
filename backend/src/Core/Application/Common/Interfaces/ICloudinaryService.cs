namespace UniMind.Application.Common.Interfaces;

public interface ICloudinaryService
{
    /// <summary>
    /// Upload ảnh đại diện hoặc ảnh bìa người dùng lên Cloudinary
    /// </summary>
    Task<string> UploadUserImageAsync(Stream fileStream, string fileName, string folderName = "avatars");

    /// <summary>
    /// Upload ảnh đính kèm bài viết cộng đồng lên Cloudinary
    /// </summary>
    Task<string> UploadPostImageAsync(Stream fileStream, string fileName);

    /// <summary>
    /// Xóa ảnh trên Cloudinary bằng URL
    /// </summary>
    Task<bool> DeleteImageByUrlAsync(string imageUrl);
}
