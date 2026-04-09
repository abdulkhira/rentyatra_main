export const uploadToCloudinary = async (file, type = "image") => {
  const url = `https://api.cloudinary.com/v1_1/dt2gdp5eq/${type === "video" ? "video" : "image"}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default");

  try {
    const res = await fetch(url, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || "Upload failed");
    }

    return data.secure_url; // ✅ This is what you need
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
};