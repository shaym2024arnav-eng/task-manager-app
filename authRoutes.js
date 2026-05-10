import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/authController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/authValidator.js";

const router = Router();

router.route("/register").post(validate(registerSchema), registerUser);
router.route("/login").post(validate(loginSchema), loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
