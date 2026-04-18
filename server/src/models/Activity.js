import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, required: true },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const Activity = mongoose.model("Activity", activitySchema);
