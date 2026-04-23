import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateCategorySchema } from "@/lib/validations/category";

import type { NextRequest } from "next/server";

/**
 * PATCH /api/categories/[categoryId]
 * カテゴリを更新する（OWNER / ADMIN のみ）
 */
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 },
      );
    }

    const { categoryId } = await params;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "カテゴリが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: category.projectId,
          userId: session.user.id,
        },
      },
      select: { role: true },
    });
    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "カテゴリを更新する権限がありません",
          },
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);
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

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.color !== undefined && { color: parsed.data.color }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PATCH /api/categories/[categoryId]]", error);
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
 * DELETE /api/categories/[categoryId]
 * カテゴリを削除する（OWNER / ADMIN のみ、TaskCategory は CASCADE で削除）
 */
export const DELETE = async (
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> },
) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 },
      );
    }

    const { categoryId } = await params;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "カテゴリが見つかりません",
          },
        },
        { status: 404 },
      );
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: category.projectId,
          userId: session.user.id,
        },
      },
      select: { role: true },
    });
    if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "カテゴリを削除する権限がありません",
          },
        },
        { status: 403 },
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/categories/[categoryId]]", error);
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
