// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ id: decoded.id, deleted: false });
    if (!user) return res.status(401).json({ message: "Invalid token (user not found)" });

    // attach minimal user info
    req.userId = user.id;
    req.user = { id: user.id, name: user.name, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
