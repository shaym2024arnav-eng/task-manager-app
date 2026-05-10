import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Project } from "../models/Project.js";
import { Team } from "../models/Team.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createProject = asyncHandler(async (req, res) => {
    const { name, description, teamId, startDate, endDate } = req.body;

    if (!name || !teamId) {
        throw new ApiError(400, "Project name and Team ID are required");
    }

    const team = await Team.findById(teamId);
    if (!team) {
        throw new ApiError(404, "Team not found");
    }

    const project = await Project.create({
        name,
        description,
        team: teamId,
        startDate,
        endDate
    });

    return res.status(201).json(
        new ApiResponse(201, project, "Project created successfully")
    );
});

const getTeamProjects = asyncHandler(async (req, res) => {
    const { teamId } = req.params;

    const projects = await Project.find({ team: teamId });

    return res.status(200).json(
        new ApiResponse(200, projects, "Projects fetched successfully")
    );
});

const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate("team");

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res.status(200).json(
        new ApiResponse(200, project, "Project fetched successfully")
    );
});

const updateProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { name, description, status, startDate, endDate } = req.body;

    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            $set: { name, description, status, startDate, endDate }
        },
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res.status(200).json(
        new ApiResponse(200, project, "Project updated successfully")
    );
});

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findByIdAndDelete(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Project deleted successfully")
    );
});

export {
    createProject,
    getTeamProjects,
    getProjectById,
    updateProject,
    deleteProject
};
