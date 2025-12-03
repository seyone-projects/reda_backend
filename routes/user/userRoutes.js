import { Router } from "express";
const router = Router();
import {
  addUser,
  loginUser,
  registerUser,
} from "../../controllers/userController.js";

import { verifyAllToken } from "../../utils/tokenAuthentication.js";

router.route("/login").get(loginUser);

router.route("/register").put(verifyAllToken, registerUser);

router.route("/adduser").put(verifyAllToken, addUser);

export default router;
