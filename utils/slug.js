exports.slug = (string) => {
  let slug = string.toLowerCase();

  // 2. Loại bỏ dấu tiếng Việt
  slug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 3. Thay thế ký tự đặc biệt và khoảng trắng bằng dấu gạch ngang
  slug = slug
    .replace(/[^\w\s-]/g, "") // Loại bỏ ký tự đặc biệt
    .replace(/\s+/g, "-") // Thay khoảng trắng bằng -
    .replace(/-+/g, "-"); // Loại bỏ dấu gạch ngang liên tiếp

  return slug;
};
