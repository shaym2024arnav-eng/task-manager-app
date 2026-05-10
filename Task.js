import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Task title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"]
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, "Description cannot exceed 2000 characters"]
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true
        },
        assignee: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        status: {
            type: String,
            enum: ["todo", "in_progress", "review", "done", "blocked"],
            default: "todo",
            index: true
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
            index: true
        },
        dueDate: {
            type: Date,
            index: true
        },
        labels: [{
            type: String,
            trim: true
        }],
        order: {
            type: Number,
            default: 0
        },
        parentTask: {
            type: Schema.Types.ObjectId,
            ref: "Task",
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Strategic Compound Indexes for performance
// 1. Getting all tasks for a project ordered by status and sequence
taskSchema.index({ project: 1, status: 1, order: 1 });

// 2. Getting user's tasks due soon
taskSchema.index({ assignee: 1, dueDate: 1 });

// 3. Finding subtasks
taskSchema.index({ parentTask: 1 });

export const Task = mongoose.model("Task", taskSchema);
