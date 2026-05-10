import { Team } from "../models/Team.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { can } from "../utils/permissions.js";

// ─────────────────────────────────────────────────────────────────
// Helper – resolve the caller's effective team role
//   Priority: team.owner  >  team.members[].role
// ─────────────────────────────────────────────────────────────────
const resolveTeamRole = (team, userId) => {
    const id = userId.toString();
    if (team.owner.toString() === id) return "owner";

    const membership = team.members.find((m) => m.user.toString() === id);
    return membership ? membership.role : null; // null = not a member
};

// ─────────────────────────────────────────────────────────────────
// Helper – look up the team from a project or task in the request
//   Checks (in order):
//     1. req.params.teamId
//     2. Project document from req.params.projectId / req.body.projectId
//     3. Task document from req.params.taskId
// ─────────────────────────────────────────────────────────────────
const resolveTeam = async (req) => {
    // Direct team route
    if (req.params.teamId) {
        return Team.findById(req.params.teamId).lean();
    }

    // Via project
    const projectId = req.params.projectId || req.body?.projectId;
    if (projectId) {
        const project = await Project.findById(projectId).populate("team").lean();
        if (!project) throw new ApiError(404, "Project not found");
        return project.team; // already populated
    }

    // Via task
    if (req.params.taskId) {
        const task = await Task.findById(req.params.taskId)
            .populate({ path: "project", populate: { path: "team" } })
            .lean();
        if (!task) throw new ApiError(404, "Task not found");
        return task.project?.team ?? null;
    }

    return null;
};

// ─────────────────────────────────────────────────────────────────
// Main RBAC middleware factory
//   Usage:  authorize(PERMISSIONS.CREATE_PROJECT)
//   Chains: verifyJWT → authorize(action) → controller
// ─────────────────────────────────────────────────────────────────
export const authorize = (action) =>
    asyncHandler(async (req, res, next) => {
        const team = await resolveTeam(req);

        // If we can't resolve a team, fall back to the global user role
        // (for super-admins or public endpoints that don't need team context)
        if (!team) {
            if (req.user.role === "superadmin") return next();
            throw new ApiError(400, "Could not resolve team context for authorization");
        }

        const userRole = resolveTeamRole(team, req.user._id);

        if (!userRole) {
            throw new ApiError(403, "You are not a member of this team");
        }

        if (!can(userRole, action)) {
            throw new ApiError(
                403,
                `Permission denied. '${userRole}' role cannot perform '${action}'`
            );
        }

        // Expose resolved role on the request for downstream controllers
        req.teamRole = userRole;
        req.team = team;
        next();
    });

// ─────────────────────────────────────────────────────────────────
// Convenience: require team membership (any role)
// ─────────────────────────────────────────────────────────────────
export const requireTeamMember = asyncHandler(async (req, res, next) => {
    const team = await resolveTeam(req);
    if (!team) throw new ApiError(400, "Could not resolve team context");

    const userRole = resolveTeamRole(team, req.user._id);
    if (!userRole) throw new ApiError(403, "You are not a member of this team");

    req.teamRole = userRole;
    req.team = team;
    next();
});

// ─────────────────────────────────────────────────────────────────
// Convenience: guard for Member updating their OWN task status only
// ─────────────────────────────────────────────────────────────────
export const authorizeTaskStatusUpdate = asyncHandler(async (req, res, next) => {
    const team = await resolveTeam(req);
    if (!team) throw new ApiError(400, "Could not resolve team context");

    const userRole = resolveTeamRole(team, req.user._id);
    if (!userRole) throw new ApiError(403, "You are not a member of this team");

    // Admins & owners can update anything
    if (userRole === "admin" || userRole === "owner") {
        req.teamRole = userRole;
        req.team = team;
        return next();
    }

    // Members can only update STATUS of their OWN tasks
    if (userRole === "member") {
        const task = await Task.findById(req.params.taskId).lean();
        if (!task) throw new ApiError(404, "Task not found");

        const isAssignee = task.assignee?.toString() === req.user._id.toString();
        if (!isAssignee) {
            throw new ApiError(403, "Members can only update the status of tasks assigned to them");
        }

        // Ensure the update body ONLY contains status — strip everything else
        const { status } = req.body;
        if (!status) throw new ApiError(400, "Only the 'status' field can be updated by a member");
        req.body = { status }; // strip other fields for safety

        req.teamRole = userRole;
        req.team = team;
        return next();
    }

    throw new ApiError(403, "Permission denied");
});

// ─────────────────────────────────────────────────────────────────
// Legacy shim  (keeps old rbac("member") calls working)
// ─────────────────────────────────────────────────────────────────
export const rbac = (requiredRole) =>
    asyncHandler(async (req, res, next) => {
        const team = await resolveTeam(req);
        if (!team) return next(); // no team context, pass through

        const userRole = resolveTeamRole(team, req.user._id);
        if (!userRole) throw new ApiError(403, "You are not a member of this team");

        const hierarchy = ["member", "admin", "owner"];
        if (hierarchy.indexOf(userRole) < hierarchy.indexOf(requiredRole)) {
            throw new ApiError(403, `Required role: ${requiredRole}`);
        }

        req.teamRole = userRole;
        req.team = team;
        next();
    });
