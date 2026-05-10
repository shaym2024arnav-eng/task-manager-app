import mongoose, { Schema } from "mongoose";

const teamMembershipSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    role: {
        type: String,
        enum: ["owner", "admin", "member"],
        default: "member"
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false }); // No need for separate IDs for subdocuments if not referenced directly

const teamSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Team name is required"],
            trim: true,
            maxlength: [100, "Team name cannot exceed 100 characters"]
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"]
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        members: [teamMembershipSchema]
    },
    {
        timestamps: true
    }
);

// Indexes for scalability and fast lookups
teamSchema.index({ "members.user": 1 });
teamSchema.index({ owner: 1 });

export const Team = mongoose.model("Team", teamSchema);
