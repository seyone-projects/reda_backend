import { Router } from "express";

// import routes
import userRoutes from "./user/userRoutes.js";

const router = Router();

// routes path define here
router.use("/users", userRoutes);

export default router;
