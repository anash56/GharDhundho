import ApiError from "../utils/ApiError.js";

export const allow =
  (...roles) =>
  (req, res, next) => {
    if (roles.includes(req.user?.role)) return next();
    next(new ApiError(403, "You do not have permission for this action"));
  };
