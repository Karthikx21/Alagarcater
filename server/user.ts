import { Request, Response } from "express";
import { storage } from "./storage";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = "24h";

// Register handler
export const register = async (req: Request, res: Response) => {
    try {
        const { username, password, name } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        // Check if username already exists
        const existingUser = await storage.getUserByUsername(username);

        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Create new user
        const user = await storage.createUser(username, password, name);

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
        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};