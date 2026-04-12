const { cloudinary } = require("../config/cloudinary");
const BannerModel = require("../models/Banner.model");

// Helper — upload only if it's a new base64/remote URL, skip if already a cloudinary URL
const uploadImage = async (image, folder) => {
  // If already uploaded to cloudinary, return as-is
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
    const { homeBanner1, homeBanner2, homeBanner3 } = req.body;

    const updateData = {};

    if (homeBanner1)
      updateData.homeBanner1 = await uploadImage(homeBanner1, "Banners/Home");
    if (homeBanner2)
      updateData.homeBanner2 = await uploadImage(homeBanner2, "Banners/Home");
    if (homeBanner3)
      updateData.homeBanner3 = await uploadImage(homeBanner3, "Banners/Home");

    let banner = await BannerModel.findOne();
    if (banner) {
      banner = await BannerModel.findByIdAndUpdate(banner._id, updateData, {
        new: true,
      });
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
      return res.status(404).json({ message: "No banner found" });
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
