import { Router } from "express";
import {
    createTask,
    deleteTask,
    getProjectTasks,
    getTaskById,
    updateTask
} from "../controllers/taskController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";
import {
    authorize,
    authorizeTaskStatusUpdate,
    requireTeamMember
} from "../middleware/rbacMiddleware.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();

// All task routes require a valid JWT
router.use(verifyJWT);

// ── POST /api/v1/tasks               → admin / owner  (resolved via body.projectId)
router.post("/", authorize(PERMISSIONS.CREATE_TASK), createTask);

// ── GET  /api/v1/tasks/project/:projectId → any team member
router.get("/project/:projectId", authorize(PERMISSIONS.VIEW_TASK), getProjectTasks);

// ── GET  /api/v1/tasks/:taskId        → any team member
router.get("/:taskId", authorize(PERMISSIONS.VIEW_TASK), getTaskById);

// ── PATCH /api/v1/tasks/:taskId
//    Admin/Owner: full update
//    Member:      status-only update for own tasks
router.patch("/:taskId", authorizeTaskStatusUpdate, updateTask);

// ── DELETE /api/v1/tasks/:taskId      → admin / owner
router.delete("/:taskId", authorize(PERMISSIONS.DELETE_TASK), deleteTask);

// ── PATCH /api/v1/tasks/:taskId/assign → admin / owner
router.patch("/:taskId/assign", authorize(PERMISSIONS.ASSIGN_TASK), updateTask);

export default router;
