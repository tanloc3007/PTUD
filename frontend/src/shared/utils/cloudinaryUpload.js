/**
 * Tiện ích tải ảnh trực tiếp lên Cloudinary (Frontend Direct Upload)
 * Cấu hình dựa trên tài khoản Cloudinary của UniMind:
 * - Cloud Name: kh0hrw3c
 * - Upload Preset: unimind_unsigned (Unsigned mode)
 * - Asset Folder: unimind_uploads
 */

export const CLOUDINARY_CONFIG = {
  cloudName: 'kh0hrw3c',
  uploadPreset: 'unimind_unsigned',
  defaultFolder: 'unimind_uploads'
};

/**
 * Tải ảnh trực tiếp lên Cloudinary từ trình duyệt
 * @param {File} file - Tập tin hình ảnh từ input type="file"
 * @param {string} subFolder - Thư mục con: 'avatars', 'banners', hoặc 'post_images'
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number }>}
 */
export async function uploadImageToCloudinary(file, subFolder = 'post_images') {
  if (!file) {
    throw new Error('Vui lòng chọn một tập tin ảnh.');
  }

  // 1. Kiểm tra dung lượng (tối đa 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Dung lượng hình ảnh không được vượt quá 10MB.');
  }

  // 2. Kiểm tra định dạng ảnh hợp lệ
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!validMimeTypes.includes(file.type)) {
    throw new Error('Chỉ chấp nhận các định dạng ảnh: JPG, PNG, WEBP, GIF, SVG.');
  }

  // 3. Chuẩn bị FormData cho Cloudinary API
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', `${CLOUDINARY_CONFIG.defaultFolder}/${subFolder}`);

  // 4. Gửi HTTP Request trực tiếp lên Cloudinary Upload API
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Tải ảnh lên Cloudinary thất bại, vui lòng thử lại.');
  }

  const data = await response.json();
  return {
    url: data.secure_url || data.url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}
