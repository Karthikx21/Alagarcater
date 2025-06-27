import { Request, Response } from "express";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "./prismaClient";

// Extend Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = "24h";

// Login handler
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        // Find user by username
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Verify password
        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                name: user.name
            },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        // Set HTTP-only cookie with the token
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: "strict",
            path: "/",
        });

        // Return user info (without password)
        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Logout handler
export const logout = (_req: Request, res: Response) => {
    res.clearCookie("auth_token");
    return res.status(200).json({ message: "Logged out successfully" });
};

// Get current session
export const getSession = (req: Request, res: Response) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; name: string };

        return res.status(200).json({
            user: {
                id: decoded.id,
                username: decoded.username,
                name: decoded.name,
            },
        });
    } catch (error) {
        console.error("Session error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Middleware to verify authentication
export const requireAuth = (req: Request, res: Response, next: Function) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};