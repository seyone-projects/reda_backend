import { Router } from "express";
import {
  getDashboard,
  updateDashboard,
} from "../controllers/dashboardController.js";
import { verifyAllToken, authorizeRoles } from "../utils/tokenAuthentication.js";
import { uploadMiddleware } from "../utils/multerUploader.js";

const router = Router();

router.get("/", getDashboard);

router.put(
  "/",
  verifyAllToken,
  authorizeRoles(["admin", "employee"]),
  uploadMiddleware([
    { name: "banner", maxCount: 4 },
    { name: "about", maxCount: 3 },
    { name: "whatWeDo", maxCount: 10 }, // Allow more, validation is in controller/model
    { name: "whatWeStand", maxCount: 4 },
    { name: "whyBehind", maxCount: 3 },
    { name: "ourSpaces", maxCount: 1 },
  ], ["image/jpeg", "image/png", "image/jpg"]),
  updateDashboard
);

export default router;
