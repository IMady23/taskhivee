/**
 * User Model
 * Stores information for both leaders and members
 * Fields:
 *   - name: User's full name
 *   - email: Unique email address
 *   - password: Hashed password
 *   - role: 'leader' or 'member'
 *   - avatar: Profile picture URL
 *   - team: Reference to leader's team (for members)
 *   - createdAt: Account creation timestamp
 */
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["leader", "member"], default: "member" },
    avatar: { type: String, default: null },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    isActive: { type: Boolean, default: true },
    // Email verification fields
    isEmailVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },

    // NEW: Member Skill Tags
    skills: {
      type: [String],
      enum: [
        "Frontend",
        "Backend",
        "UI",
        "Testing",
        "DevOps",
        "Database",
        "API",
        "Mobile",
      ],
      default: [],
    },
    skillsUpdatedAt: {
      type: Date,
      default: null,
    },

    // NEW: Focus Mode preference
    focusModeEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcryptjs.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (password) {
  return await bcryptjs.compare(password, this.password);
};

// remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export default mongoose.model("User", userSchema);
