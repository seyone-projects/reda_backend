import User from "../models/userModal.js";
import { validationResult } from "express-validator";
import { handleErrors } from "../utils/appError.js";

export async function registerUser(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, errors: errors.array() });
    }

    const { username, fullname, email, password, mobilenumber } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { mobilenumber }],
    });
    if (existingUser) {
      return res
        .status(409)
        .json({
          status: false,
          message: "Email or mobile number already exists",
        });
    }

    const user = await User.create({
      username,
      fullname,
      email,
      password,
      mobilenumber,
      role: "employee",
    });

    return res.status(201).json({
      status: true,
      message: "Employee registered successfully",
      data: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

export async function createEmployee(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, errors: errors.array() });
    }

    const { username, fullname, email, password, mobilenumber } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { mobilenumber }],
    });
    if (existingUser) {
      return res.status(409).json({
        status: false,
        message: "Email or mobile number already exists",
      });
    }

    const user = await User.create({
      username,
      fullname,
      email,
      password,
      mobilenumber,
      role: "employee",
    });

    return res.status(201).json({
      status: true,
      message: "Employee registered successfully",
      data: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

export async function loginUser(req, res) {
  try {
    const { mobilenumber, password } = req.body;

    const user = await User.findOne({ mobilenumber }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid mobile number or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid mobile number or password" });
    }

    // Check if user is admin or employee (optional strict check if needed, but requirements say "using phonenumber and password can login")
    // If we want to restrict login to only admin/employee for this specific endpoint, we can add a check.
    // However, usually login is generic. The requirement "two types of roles must handled (employee,admin)" implies they exist.

    const token = user.generateToken();
    user.sessionToken = token;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

export async function addUser(req, res) {
  try {
    const {
      username,
      fullname,
      email,
      password,
      dob,
      photo,
      address,
      mobilenumber,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ status: false, message: "Email already registered" });
    }

    const user = await User.create({
      username,
      fullname,
      email,
      password,
      dob,
      photo,
      address,
      mobilenumber,
      role: "user",
    });

    return res.status(201).json({
      status: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}

export async function getUserList(req, res) {
  try {
    const users = await User.find(
      { role: "user" },
      { sessionToken: 0, password: 0 }
    );

    return res.status(201).json({
      status: true,
      data: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
}
