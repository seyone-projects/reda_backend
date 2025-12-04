import Dashboard from "../models/dashboardModel.js";
import { uploadFilesAndGenerateUrls } from "../utils/s3.js";

export async function getDashboard(req, res) {
  try {
    const dashboard = await Dashboard.getDashboard();
    return res.status(200).json({
      status: true,
      data: dashboard,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

export async function updateDashboard(req, res) {
  try {
    const dashboard = await Dashboard.getDashboard();
    const files = req.files || {};
    const body = req.body;

    // Helper to process uploads and update fields
    const processSection = async (sectionName, existingImages) => {
      let newImages = [];
      if (files[sectionName]) {
        const uploaded = await uploadFilesAndGenerateUrls(files[sectionName]);
        newImages = uploaded.map((f) => f.documentPath);
      }
      
      // If "replace" logic is desired, we overwrite. 
      // If "append" is desired, we concat. 
      // Given the strict counts, it's safer to treat the incoming request as the "new state" 
      // or append if the user sends existing URLs in body (not implemented here for simplicity, assuming fresh uploads or full replace).
      // However, usually with file uploads, we might want to keep existing ones.
      // Let's assume for now that if files are uploaded, they REPLACE the existing ones for that section, 
      // OR we can handle a mix if the frontend sends "existing images" list.
      // For simplicity and meeting the "dynamic" requirement:
      // We will append new uploads to existing ones, UNLESS a "clear_{section}" flag is sent or similar.
      // BUT, the requirement says "banner section (minimum 1 to maximum 4 images allowed)".
      // A common pattern is: Frontend sends `existing_banner_urls` (array) + `banner` (files).
      // We combine them.
      
      // Let's look for existing URLs in body, e.g., req.body.banner (which might be a string or array of strings)
      let currentImages = [];
      if (body[sectionName]) {
         // body[sectionName] could be a single URL string or array of strings
         currentImages = Array.isArray(body[sectionName]) ? body[sectionName] : [body[sectionName]];
      }
      
      // If no body param for section, maybe we keep existing? 
      // But if the user wants to delete all, they might send empty array.
      // Let's rely on the body being the "source of truth" for RETAINED images if provided.
      // If body[sectionName] is undefined, we might assume "don't change existing" or "clear all"?
      // Safest approach for an API: 
      // 1. If files are uploaded, add them.
      // 2. If body[sectionName] is present, use that as the base (retained images).
      // 3. If body[sectionName] is NOT present, keep DB state? Or clear?
      // Let's go with: 
      // - If files[sectionName] exists OR body[sectionName] exists -> Update the section.
      // - Combined list = (body[sectionName] || []) + (newly uploaded files).
      
      if (files[sectionName] || body[sectionName] !== undefined) {
         const retained = body[sectionName] ? (Array.isArray(body[sectionName]) ? body[sectionName] : [body[sectionName]]) : [];
         const combined = [...retained, ...newImages];
         dashboard[sectionName] = combined;
      }
    };

    await processSection("banner", dashboard.banner);
    await processSection("about", dashboard.about);
    await processSection("whatWeDo", dashboard.whatWeDo);
    await processSection("whatWeStand", dashboard.whatWeStand);
    await processSection("whyBehind", dashboard.whyBehind);
    await processSection("ourSpaces", dashboard.ourSpaces);

    if (body.socialMedia) {
      // Expecting JSON string if coming from multipart/form-data, or object if JSON
      let socialData = body.socialMedia;
      if (typeof socialData === 'string') {
        try {
            socialData = JSON.parse(socialData);
        } catch (e) {
            // ignore or handle error
        }
      }
      dashboard.socialMedia = { ...dashboard.socialMedia, ...socialData };
    }

    await dashboard.save();

    return res.status(200).json({
      status: true,
      message: "Dashboard updated successfully",
      data: dashboard,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ status: false, message: error.message, errors: error.errors });
    }
    return res.status(500).json({ status: false, message: "Server error" });
  }
}
