const CourseModel = require("../models/Course.model");

// ✅ CREATE Course
const createCourse = async (req, res) => {
  try {
    const { title, sessions, isPublished } = req.body;

    const course = await CourseModel.create({
      title,
      sessions: sessions || [],
      totalSessions: sessions?.length || 0,
      isPublished: isPublished || false,
    });

    res.status(201).json({ success: true, message: "Course created", course });
  } catch (error) {
    console.error("Error in createCourse:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ GET ALL Courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await CourseModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error("Error in getAllCourses:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ GET Single Course
const getCourseById = async (req, res) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res.status(200).json({ success: true, course });
  } catch (error) {
    console.error("Error in getCourseById:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ UPDATE Course
const updateCourse = async (req, res) => {
  try {
    const { title, isPublished } = req.body;

    const updateData = {
      ...(title && { title }),
      ...(typeof isPublished === "boolean" && { isPublished }),
    };

    const course = await CourseModel.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true },
    );

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, message: "Course updated", course });
  } catch (error) {
    console.error("Error in updateCourse:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ DELETE Course
const deleteCourse = async (req, res) => {
  try {
    const course = await CourseModel.findByIdAndDelete(req.params.id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }
    res.status(200).json({ success: true, message: "Course deleted" });
  } catch (error) {
    console.error("Error in deleteCourse:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ ADD Session
const addSession = async (req, res) => {
  try {
    const { sessionNumber, title, subtitle, resources } = req.body;

    const course = await CourseModel.findByIdAndUpdate(
      req.params.id,
      {
        $push: { sessions: { sessionNumber, title, subtitle, resources } },
        $inc: { totalSessions: 1 },
      },
      { new: true },
    );

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    res.status(201).json({ success: true, message: "Session added", course });
  } catch (error) {
    console.error("Error in addSession:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ UPDATE Session
const updateSession = async (req, res) => {
  try {
    const { courseId, sessionId } = req.params;
    const { title, subtitle, resources } = req.body;

    const course = await CourseModel.findOneAndUpdate(
      { _id: courseId, "sessions._id": sessionId },
      {
        $set: {
          ...(title && { "sessions.$.title": title }),
          ...(subtitle && { "sessions.$.subtitle": subtitle }),
          ...(resources && { "sessions.$.resources": resources }),
        },
      },
      { new: true },
    );

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course or Session not found" });
    }

    res.status(200).json({ success: true, message: "Session updated", course });
  } catch (error) {
    console.error("Error in updateSession:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ DELETE Session
const deleteSession = async (req, res) => {
  try {
    const { courseId, sessionId } = req.params;

    const course = await CourseModel.findByIdAndUpdate(
      courseId,
      {
        $pull: { sessions: { _id: sessionId } },
        $inc: { totalSessions: -1 },
      },
      { new: true },
    );

    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, message: "Session deleted", course });
  } catch (error) {
    console.error("Error in deleteSession:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addSession,
  updateSession,
  deleteSession,
};
