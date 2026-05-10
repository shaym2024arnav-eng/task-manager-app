import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTask = asyncHandler(async (req, res) => {
    const { title, description, projectId, assignee, priority, dueDate, labels } = req.body;

    if (!title || !projectId) {
        throw new ApiError(400, "Task title and Project ID are required");
    }

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const task = await Task.create({
        title,
        description,
        project: projectId,
        assignee,
        createdBy: req.user._id,
        priority,
        dueDate,
        labels
    });

    return res.status(201).json(
        new ApiResponse(201, task, "Task created successfully")
    );
});

const getProjectTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    // Members only see tasks assigned to them
    const filter = { project: projectId };
    if (req.teamRole === "member") {
        filter.assignee = req.user._id;
    }

    const tasks = await Task.find(filter).populate("assignee", "name email avatar");

    return res.status(200).json(
        new ApiResponse(200, tasks, "Tasks fetched successfully")
    );
});

const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate("assignee project createdBy");

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    return res.status(200).json(
        new ApiResponse(200, task, "Task fetched successfully")
    );
});

const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    // req.body has already been stripped to { status } only for Members
    // by authorizeTaskStatusUpdate middleware — no extra logic needed here.
    const { title, description, status, priority, assignee, dueDate, labels } = req.body;

    // Build the update object, skipping undefined fields
    const updateFields = {};
    if (title !== undefined)       updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (status !== undefined)      updateFields.status = status;
    if (priority !== undefined)    updateFields.priority = priority;
    if (assignee !== undefined)    updateFields.assignee = assignee;
    if (dueDate !== undefined)     updateFields.dueDate = dueDate;
    if (labels !== undefined)      updateFields.labels = labels;

    const task = await Task.findByIdAndUpdate(
        taskId,
        { $set: updateFields },
        { new: true, runValidators: true }
    );

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    return res.status(200).json(
        new ApiResponse(200, task, "Task updated successfully")
    );
});

const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Task deleted successfully")
    );
});

export {
    createTask,
    getProjectTasks,
    getTaskById,
    updateTask,
    deleteTask
};
