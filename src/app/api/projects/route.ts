import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createProjectSchema } from "@/lib/validations/project";

import type { NextRequest } from "next/server";

/**
 * GET /api/projects
 * 自分が参加しているプロジェクト一覧を返す
 */
export const GET = async (_request: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 },
      );
    }

    const memberships = await prisma.projectMember.findMany({
      where: { userId: session.user.id },
      select: { projectId: true },
    });

    const projectIds = memberships.map((m) => m.projectId);

    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      include: {
        owner: { select: { id: true, name: true } },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: projects });
  } catch (error) {
    console.error("[GET /api/projects]", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "サーバーエラーが発生しました",
        },
      },
      { status: 500 },
    );
  }
};

/**
 * POST /api/projects
 * プロジェクトを作成し、作成者を OWNER として登録する
 */
export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0].message,
          },
        },
        { status: 400 },
      );
    }

    const key = generateProjectKey(parsed.data.name);

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        key,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true } },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects]", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "サーバーエラーが発生しました",
        },
      },
      { status: 500 },
    );
  }
};

/**
 * プロジェクト名からキーを自動生成する
 * 例: "Devin Task Board" → "DTB"
 */
const generateProjectKey = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return words
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);
  }
  return name.trim().toUpperCase().slice(0, 3);
};
