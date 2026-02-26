const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/gif"];
function isValidImageMime(mime) {
    return allowedMime.includes(mime);
}
module.exports = { isValidImageMime };