import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createCategorySchema } from "@/lib/validations/category";

import type { NextRequest } from "next/server";

/**
 * GET /api/projects/[id]/categories
 * プロジェクト配下のカテゴリ一覧を返す（参加メンバーのみ）
 */
export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 },
      );
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "プロジェクトが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: session.user.id },
      },
      select: { role: true },
    });
    if (!member) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "このプロジェクトへのアクセス権がありません",
          },
        },
        { status: 403 },
      );
    }

    const categories = await prisma.category.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("[GET /api/projects/[id]/categories]", error);
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
 * POST /api/projects/[id]/categories
 * プロジェクト配下にカテゴリを作成する（OWNER / ADMIN のみ）
 */
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 },
      );
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "プロジェクトが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: session.user.id },
      },
      select: { role: true },
    });
    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "カテゴリを作成する権限がありません",
          },
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);
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

    const category = await prisma.category.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color,
        projectId,
      },
    });

    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/projects/[id]/categories]", error);
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
