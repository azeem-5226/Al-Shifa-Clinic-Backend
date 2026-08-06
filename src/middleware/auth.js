const requireAuth = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  const userRole = req.headers["x-user-role"];
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Missing user ID" });
  }
  req.user = {
    id: userId,
    role: userRole
  };
  next();
};
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }
    next();
  });
};
export {
  requireAdmin,
  requireAuth
};
