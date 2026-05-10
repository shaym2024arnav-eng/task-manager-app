/**
 * RBAC Permission Registry
 * ─────────────────────────
 * Roles (in ascending privilege order):
 *   member  → view assigned tasks, update task status on their own tasks
 *   admin   → everything a member can do + create projects, assign tasks, manage members
 *   owner   → everything an admin can do + delete team, transfer ownership
 *
 * Pattern: each action is a plain string constant.
 * Middleware checks req.user's effective role against the required action.
 */

// ──────────────────────────────────────────────
// Action constants  (import these in routes/middleware)
// ──────────────────────────────────────────────
export const PERMISSIONS = {
    // Project
    CREATE_PROJECT: "create:project",
    UPDATE_PROJECT: "update:project",
    DELETE_PROJECT: "delete:project",
    VIEW_PROJECT:   "view:project",

    // Task
    CREATE_TASK:         "create:task",
    VIEW_TASK:           "view:task",
    UPDATE_TASK:         "update:task",        // any field
    UPDATE_TASK_STATUS:  "update:task:status", // own tasks only (member)
    DELETE_TASK:         "delete:task",
    ASSIGN_TASK:         "assign:task",

    // Team membership
    INVITE_MEMBER:  "invite:member",
    REMOVE_MEMBER:  "remove:member",
    UPDATE_ROLE:    "update:role",
    VIEW_MEMBERS:   "view:members",
    DELETE_TEAM:    "delete:team",
};

// ──────────────────────────────────────────────
// Role → allowed actions map
// ──────────────────────────────────────────────
const ROLE_PERMISSIONS = {
    member: [
        PERMISSIONS.VIEW_PROJECT,
        PERMISSIONS.VIEW_TASK,
        PERMISSIONS.UPDATE_TASK_STATUS, // own tasks only — enforced in controller
        PERMISSIONS.VIEW_MEMBERS,
    ],

    admin: [
        // inherits member
        PERMISSIONS.VIEW_PROJECT,
        PERMISSIONS.VIEW_TASK,
        PERMISSIONS.UPDATE_TASK_STATUS,
        PERMISSIONS.VIEW_MEMBERS,
        // admin-only
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.UPDATE_PROJECT,
        PERMISSIONS.CREATE_TASK,
        PERMISSIONS.UPDATE_TASK,
        PERMISSIONS.DELETE_TASK,
        PERMISSIONS.ASSIGN_TASK,
        PERMISSIONS.INVITE_MEMBER,
        PERMISSIONS.REMOVE_MEMBER,
    ],

    owner: [
        // inherits admin — owners get everything
        PERMISSIONS.VIEW_PROJECT,
        PERMISSIONS.VIEW_TASK,
        PERMISSIONS.UPDATE_TASK_STATUS,
        PERMISSIONS.VIEW_MEMBERS,
        PERMISSIONS.CREATE_PROJECT,
        PERMISSIONS.UPDATE_PROJECT,
        PERMISSIONS.DELETE_PROJECT,
        PERMISSIONS.CREATE_TASK,
        PERMISSIONS.UPDATE_TASK,
        PERMISSIONS.DELETE_TASK,
        PERMISSIONS.ASSIGN_TASK,
        PERMISSIONS.INVITE_MEMBER,
        PERMISSIONS.REMOVE_MEMBER,
        PERMISSIONS.UPDATE_ROLE,
        PERMISSIONS.DELETE_TEAM,
    ],
};

/**
 * Check whether a role is allowed to perform an action.
 * @param {string} role     - "member" | "admin" | "owner"
 * @param {string} action   - one of PERMISSIONS.*
 * @returns {boolean}
 */
export const can = (role, action) => {
    const allowed = ROLE_PERMISSIONS[role] || [];
    return allowed.includes(action);
};

export default ROLE_PERMISSIONS;
