import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
            maxlength: [100, "Project name cannot exceed 100 characters"]
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, "Description cannot exceed 1000 characters"]
        },
        team: {
            type: Schema.Types.ObjectId,
            ref: "Team",
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: ["active", "archived", "on_hold", "completed"],
            default: "active",
            index: true
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

// Compound index for frequent queries
projectSchema.index({ team: 1, status: 1 });

export const Project = mongoose.model("Project", projectSchema);
