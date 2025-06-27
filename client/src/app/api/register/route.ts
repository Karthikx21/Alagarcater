import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }
    // Hash password
    const hashedPassword = await hash(password, 10);
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
      },
    });
    return NextResponse.json({ user: { id: user.id, username: user.username, name: user.name } });
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
} 