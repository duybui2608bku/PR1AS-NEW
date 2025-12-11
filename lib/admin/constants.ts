/**
 * Admin Constants
 * Shared constants for admin pages
 */

/**
 * Mapping service keys to Vietnamese names and descriptions
 */
export const SERVICE_MAPPING: Record<string, { name: string; description: string }> = {
  // Homecare services
  "homecare-organizing": {
    name: "Dọn dẹp nhà cửa",
    description: "Dịch vụ sắp xếp và dọn dẹp nhà cửa ngăn nắp",
  },
  "homecare-cooking": {
    name: "Nấu ăn",
    description: "Dịch vụ nấu ăn với nhiều loại món ăn khác nhau",
  },
  "homecare-shopping": {
    name: "Đi chợ mua sắm",
    description: "Dịch vụ đi chợ và mua sắm hộ",
  },
  "homecare-laundry": {
    name: "Giặt giũ",
    description: "Dịch vụ giặt là và chăm sóc quần áo",
  },
  "homecare-cleaning": {
    name: "Vệ sinh nhà cửa",
    description: "Dịch vụ vệ sinh và làm sạch nhà cửa",
  },

  // Grooming services
  "grooming-hair": {
    name: "Làm tóc",
    description: "Dịch vụ làm tóc và chăm sóc tóc",
  },
  "grooming-makeup": {
    name: "Trang điểm",
    description: "Dịch vụ trang điểm chuyên nghiệp",
  },
  "grooming-nails": {
    name: "Làm móng",
    description: "Dịch vụ chăm sóc và làm đẹp móng tay, móng chân",
  },
  "grooming-nail": {
    name: "Làm móng",
    description: "Dịch vụ chăm sóc móng tay",
  },
  "grooming-facial": {
    name: "Chăm sóc da mặt",
    description: "Dịch vụ chăm sóc và làm đẹp da mặt",
  },
  "grooming-skincare": {
    name: "Chăm sóc da",
    description: "Dịch vụ chăm sóc và điều trị da",
  },
  "grooming-massage": {
    name: "Massage",
    description: "Dịch vụ massage thư giãn và trị liệu",
  },

  // Assistance services
  "assistance-interpreter": {
    name: "Phiên dịch",
    description: "Dịch vụ phiên dịch ngôn ngữ",
  },
  "assistance-personal": {
    name: "Trợ lý cá nhân",
    description: "Dịch vụ trợ lý cá nhân",
  },
  "assistance-onsite": {
    name: "Hỗ trợ tại chỗ",
    description: "Dịch vụ hỗ trợ chuyên nghiệp tại chỗ",
  },
  "assistance-virtual": {
    name: "Trợ lý ảo",
    description: "Dịch vụ trợ lý ảo từ xa",
  },
  "assistance-tour-guide": {
    name: "Hướng dẫn viên du lịch",
    description: "Dịch vụ hướng dẫn viên du lịch",
  },
  "assistance-tutor": {
    name: "Gia sư",
    description: "Dịch vụ gia sư và dạy kèm",
  },
  "assistance-driver": {
    name: "Tài xế",
    description: "Dịch vụ lái xe và đưa đón",
  },

  // Interpreter language pairs
  vi_to_en: {
    name: "Phiên dịch Việt - Anh",
    description: "Phiên dịch từ tiếng Việt sang tiếng Anh",
  },
  vi_to_ko: {
    name: "Phiên dịch Việt - Hàn",
    description: "Phiên dịch từ tiếng Việt sang tiếng Hàn",
  },
  vi_to_ja: {
    name: "Phiên dịch Việt - Nhật",
    description: "Phiên dịch từ tiếng Việt sang tiếng Nhật",
  },
  vi_to_zh: {
    name: "Phiên dịch Việt - Trung",
    description: "Phiên dịch từ tiếng Việt sang tiếng Trung",
  },
  en_to_vi: {
    name: "Phiên dịch Anh - Việt",
    description: "Phiên dịch từ tiếng Anh sang tiếng Việt",
  },
  en_to_ko: {
    name: "Phiên dịch Anh - Hàn",
    description: "Phiên dịch từ tiếng Anh sang tiếng Hàn",
  },
  en_to_ja: {
    name: "Phiên dịch Anh - Nhật",
    description: "Phiên dịch từ tiếng Anh sang tiếng Nhật",
  },
  en_to_zh: {
    name: "Phiên dịch Anh - Trung",
    description: "Phiên dịch từ tiếng Anh sang tiếng Trung",
  },
  ko_to_vi: {
    name: "Phiên dịch Hàn - Việt",
    description: "Phiên dịch từ tiếng Hàn sang tiếng Việt",
  },
  ko_to_en: {
    name: "Phiên dịch Hàn - Anh",
    description: "Phiên dịch từ tiếng Hàn sang tiếng Anh",
  },
  ko_to_ja: {
    name: "Phiên dịch Hàn - Nhật",
    description: "Phiên dịch từ tiếng Hàn sang tiếng Nhật",
  },
  ko_to_zh: {
    name: "Phiên dịch Hàn - Trung",
    description: "Phiên dịch từ tiếng Hàn sang tiếng Trung",
  },
  ja_to_vi: {
    name: "Phiên dịch Nhật - Việt",
    description: "Phiên dịch từ tiếng Nhật sang tiếng Việt",
  },
  ja_to_en: {
    name: "Phiên dịch Nhật - Anh",
    description: "Phiên dịch từ tiếng Nhật sang tiếng Anh",
  },
  ja_to_ko: {
    name: "Phiên dịch Nhật - Hàn",
    description: "Phiên dịch từ tiếng Nhật sang tiếng Hàn",
  },
  ja_to_zh: {
    name: "Phiên dịch Nhật - Trung",
    description: "Phiên dịch từ tiếng Nhật sang tiếng Trung",
  },
  zh_to_vi: {
    name: "Phiên dịch Trung - Việt",
    description: "Phiên dịch từ tiếng Trung sang tiếng Việt",
  },
  zh_to_en: {
    name: "Phiên dịch Trung - Anh",
    description: "Phiên dịch từ tiếng Trung sang tiếng Anh",
  },
  zh_to_ko: {
    name: "Phiên dịch Trung - Hàn",
    description: "Phiên dịch từ tiếng Trung sang tiếng Hàn",
  },
  zh_to_ja: {
    name: "Phiên dịch Trung - Nhật",
    description: "Phiên dịch từ tiếng Trung sang tiếng Nhật",
  },

  // Companionship services
  "companionship-level-1": {
    name: "Đồng hành Cấp 1",
    description:
      "Không tiếp xúc thể chất, trò chuyện thông thường, trang phục thoải mái",
  },
  "companionship-level-2": {
    name: "Đồng hành Cấp 2",
    description:
      "Không tiếp xúc thể chất, trò chuyện trí tuệ, trang phục bán chính thức",
  },
  "companionship-level-3": {
    name: "Đồng hành Cấp 3",
    description:
      "Cho phép tiếp xúc thể chất không thân mật, trò chuyện trí tuệ, trang phục chính thức",
  },
  "companionship-basic": {
    name: "Đồng hành cơ bản",
    description: "Dịch vụ đồng hành cơ bản",
  },
  "companionship-standard": {
    name: "Đồng hành tiêu chuẩn",
    description: "Dịch vụ đồng hành tiêu chuẩn",
  },
  "companionship-premium": {
    name: "Đồng hành cao cấp",
    description: "Dịch vụ đồng hành cao cấp",
  },
  "companionship-luxury": {
    name: "Đồng hành sang trọng",
    description: "Dịch vụ đồng hành sang trọng",
  },
};

/**
 * Get service name from slug or name_key
 */
export function getServiceName(slug?: string, nameKey?: string): string {
  if (slug && SERVICE_MAPPING[slug]) {
    return SERVICE_MAPPING[slug].name;
  }

  // Try with name_key (convert to slug format)
  if (nameKey) {
    const slugFromKey = nameKey
      .replace(/^SERVICE_/, "")
      .toLowerCase()
      .replace(/_/g, "-");
    if (SERVICE_MAPPING[slugFromKey]) {
      return SERVICE_MAPPING[slugFromKey].name;
    }
  }

  // Fallback: format the text nicely
  const text = slug || nameKey || "";
  return text
    .replace(/^SERVICE_/, "")
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Get service description from slug or name_key
 */
export function getServiceDescription(
  slug?: string,
  nameKey?: string,
  fallbackDescription?: string
): string {
  if (slug && SERVICE_MAPPING[slug]) {
    return SERVICE_MAPPING[slug].description;
  }

  // Try with name_key (convert to slug format)
  if (nameKey) {
    const slugFromKey = nameKey
      .replace(/^SERVICE_/, "")
      .toLowerCase()
      .replace(/_/g, "-");
    if (SERVICE_MAPPING[slugFromKey]) {
      return SERVICE_MAPPING[slugFromKey].description;
    }
  }

  // Return fallback description if provided
  return fallbackDescription || "";
}

