import { Router } from "express";
import {
  addUser,
  loginUser,
  registerUser,
  createEmployee,
  getUserList,
} from "../../controllers/userController.js";

import { verifyAllToken, authorizeRoles } from "../../utils/tokenAuthentication.js";

const router = Router();

router.post("/login", loginUser);
router.post("/register", registerUser);

// Admin only routes
router.post("/create-employee", verifyAllToken, authorizeRoles(["admin"]), createEmployee);

router.post("/add-user", verifyAllToken, authorizeRoles(["admin"]), addUser);
router.get("/list", verifyAllToken, authorizeRoles(["admin"]), getUserList);

export default router;
