import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next();
    } catch (error) {
        const errorMessage = error.errors.map((err) => err.message).join(", ");
        throw new ApiError(400, errorMessage, error.errors);
    }
};
