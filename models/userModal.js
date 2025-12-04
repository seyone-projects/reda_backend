import mongoose from "mongoose";
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "Username is required"],
    },
    fullname: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: [true, "Email is required"],
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    mobilenumber: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "Mobile number is required"],
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    },
    address: {
      type: String,
      trim: true,
    },
    dob: {
      type: Date,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    photo: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "employee", "user"],
      default: "user",
    },
    sessionToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET || "apartmentUserAccessToken",
    { expiresIn: "7d" }
  );
};

userSchema.method("toJSON", function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const user = model("User", userSchema);

export default user;
