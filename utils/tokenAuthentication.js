import jwt from "jsonwebtoken";
import User from "../models/userModal.js";
import { handleErrors } from "./appError.js";

const config = process.env;

export const verifyAllToken = async (req, res, next) => {
  let token = req.headers["authorization"];
  const pageName = req.headers["pagename"];
  
  if (!token) {
    return res.status(403).json({
      status: false,
      message: "A token is required for authentication",
    });
  }
  token = token.split(" ")[1];
  try {
    const decoded = await jwt.verify(token, config.JWT_SECRET);
    
    const userData = await User.findOne({ _id: decoded.id });
    if (!userData) {
      return res.status(403).json({ status: false, message: "User not found" });
    }

    if (!userData.sessionToken) {
      return res.status(401).json({
        status: false,
        message: "Invalid token",
      });
    }

    req.decodeToken = decoded;
    req.userId = decoded.id;
    req.userData = userData;
    req.role = userData?.role;

    next();
  } catch (err) {
    return handleErrors(err, res, req);
  }
};

export const decodeToken = async (token) => {
  if (!token) {
    return false;
  }
  token = token.split(" ")[1];
  try {
    const decoded = await jwt.verify(token, config.JWT_SECRET);
    return decoded;
  } catch (err) {}
};

export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (req.isEcMc) {
      return next();
    }
    if (!req.role || !allowedRoles.includes(req.role)) {
      return res.status(403).json({
        status: false,
        message: "Access denied. Insufficient permissions.",
      });
    }
    next();
  };
};
