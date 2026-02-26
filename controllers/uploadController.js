const cloudinaryService = require("../services/cloudinary.service");
const { ok, handlePrismaError } = require("../utils/apiResponse");

exports.uploadMultiple = async (req, res) => {
  try {
    const folder = "cami_kids_hd/temp/";
    const files = req.body.files || [];
    const results = [];

    for (const file of files) {
      const publicId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const uploaded = await cloudinaryService.uploadBase64(file, folder, publicId);
      results.push({
        url: uploaded.secure_url,
        public_id: uploaded.public_id,
      });
    }

    return ok(res, results, "Upload successful");
  } catch (error) {
    return handlePrismaError(res, error);
  }
};
