const jwt = require("jsonwebtoken");
const { handleUpload } = require("@vercel/blob/client");

const getTokenPayload = (rawToken) => {
  const token = String(rawToken || "").trim();
  if (!token) {
    const error = new Error("Not authorized to upload videos");
    error.statusCode = 401;
    throw error;
  }

  return jwt.verify(token, process.env.JWT_SECRET || "dev_jwt_secret");
};

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ message: "Method not allowed" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return response.status(503).json({
      message:
        "BLOB_READ_WRITE_TOKEN is missing. Configure Vercel Blob before uploading videos in production."
    });
  }

  try {
    const jsonResponse = await handleUpload({
      body: request.body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const parsedPayload = JSON.parse(String(clientPayload || "{}"));
        const user = getTokenPayload(parsedPayload.token);

        if (user.role !== "educator" && user.role !== "admin") {
          const error = new Error("Only educators can upload videos");
          error.statusCode = 403;
          throw error;
        }

        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "video/x-matroska",
            "application/octet-stream"
          ],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: user.id,
            role: user.role,
            pathname
          })
        };
      },
      onUploadCompleted: async () => {}
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(error.statusCode || 400).json({
      message: error.message || "Could not upload video"
    });
  }
};
