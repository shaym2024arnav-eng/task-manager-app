import { Router } from "express";
import {
    createProject,
    deleteProject,
    getProjectById,
    getTeamProjects,
    updateProject
} from "../controllers/projectController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { authorize, rbac } from "../middleware/rbacMiddleware.js";
import { PERMISSIONS } from "../utils/permissions.js";

const router = Router();

// All project routes require a valid JWT
router.use(verifyJWT);

// ── GET  /api/v1/projects/team/:teamId  → any team member
router.get("/team/:teamId", rbac("member"), getTeamProjects);

// ── POST /api/v1/projects             → admin / owner only
router.post("/", authorize(PERMISSIONS.CREATE_PROJECT), createProject);

// ── GET  /api/v1/projects/:projectId  → any team member (resolved via project)
router.get("/:projectId", authorize(PERMISSIONS.VIEW_PROJECT), getProjectById);

// ── PATCH /api/v1/projects/:projectId → admin / owner only
router.patch("/:projectId", authorize(PERMISSIONS.UPDATE_PROJECT), updateProject);

// ── DELETE /api/v1/projects/:projectId → owner only
router.delete("/:projectId", authorize(PERMISSIONS.DELETE_PROJECT), deleteProject);

export default router;
