const { cloudinary } = require("../config/cloudinary");
const BannerModel = require("../models/Banner.model");

// Helper — upload only if needed
const uploadImage = async (image, folder) => {
  if (!image) return null;

  // Skip if already uploaded
  if (image.startsWith("https://res.cloudinary.com")) return image;

  const result = await cloudinary.uploader.upload(image, {
    folder,
    resource_type: "image",
    type: "upload",
  });

  return result.secure_url;
};

// Create / Update Banner
const createOrUpdateBanner = async (req, res) => {
  try {
    const updateData = {};

    // 🔥 Loop through all 15 banners dynamically
    for (let i = 1; i <= 15; i++) {
      const key = `homeBanner${i}`;

      if (req.body[key]) {
        updateData[key] = await uploadImage(req.body[key], "Banners/Home");
      }
    }

    let banner = await BannerModel.findOne();

    if (banner) {
      banner = await BannerModel.findByIdAndUpdate(
        banner._id,
        { $set: updateData },
        { new: true },
      );
    } else {
      banner = await BannerModel.create(updateData);
    }

    res.status(201).json({
      success: true,
      message: "Banners saved successfully",
      banner,
    });
  } catch (error) {
    console.error("Error in createOrUpdateBanner:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get Banner
const getBanner = async (req, res) => {
  try {
    const banner = await BannerModel.findOne();

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "No banner found",
      });
    }

    res.status(200).json({
      success: true,
      banner,
    });
  } catch (error) {
    console.error("Error in getBanner:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching banner",
      error: error.message,
    });
  }
};

// Delete Banner
const deleteBanners = async (req, res) => {
  try {
    await BannerModel.deleteMany({});

    res.status(200).json({
      success: true,
      message: "Banners deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteBanners:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createOrUpdateBanner,
  getBanner,
  deleteBanners,
};
