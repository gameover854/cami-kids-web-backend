const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

exports.uploadBuffer = (fileBuffer, folder, publicId = null) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId || undefined,
        resource_type: "image",
        format: "webp",
        transformation: [{ width: 1200, crop: "limit" }, { quality: "auto" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

exports.uploadBase64 = (base64, folder, publicId, tags = "draft") => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64,
      {
        folder,
        public_id: publicId || undefined,
        resource_type: "image",
        format: "webp",
        transformation: [{ width: 1200, crop: "limit" }, { quality: "auto" }],
        tags: tags,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
  });
};

exports.deleteByPublicId = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

exports.deleteByFolder = async (folder) => {
  return cloudinary.api.delete_folder(folder);
};

exports.deleteByTags = async (tag) => {
  return cloudinary.api.delete_resources_by_tag(tag);
};
