import { Router } from "express";

// import routes
import userRoutes from "./user/userRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";

const router = Router();

// routes path define here
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
