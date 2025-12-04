import mongoose from "mongoose";
const { Schema, model } = mongoose;

const dashboardSchema = new Schema(
  {
    banner: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length >= 1 && v.length <= 4;
        },
        message: "Banner must have between 1 and 4 images.",
      },
    },
    about: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length === 3;
        },
        message: "About section must have exactly 3 images.",
      },
    },
    whatWeDo: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length > 0 && v.length % 2 === 0;
        },
        message: "What We Do section must have an even number of images.",
      },
    },
    whatWeStand: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length >= 1 && v.length <= 4;
        },
        message: "What We Stand section must have between 1 and 4 images.",
      },
    },
    whyBehind: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length >= 1 && v.length <= 3;
        },
        message: "Why Behind section must have between 1 and 3 images.",
      },
    },
    ourSpaces: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length === 1;
        },
        message: "Our Spaces section must have exactly 1 image.",
      },
    },
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
      youtube: String,
    },
  },
  {
    timestamps: true,
  }
);

// Singleton pattern: Ensure only one dashboard document exists
dashboardSchema.statics.getDashboard = async function () {
  const dashboard = await this.findOne();
  if (dashboard) {
    return dashboard;
  }
  return await this.create({});
};

const Dashboard = model("Dashboard", dashboardSchema);

export default Dashboard;
