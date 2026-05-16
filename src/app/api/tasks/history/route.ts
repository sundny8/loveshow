import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db, generatedImages, imageTasks, users } from "@/db";
import { eq, desc, inArray } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if admin by querying database
    const [currentUser] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    
    const isAdmin = currentUser?.role === 'ADMIN';
    
    // Parse query params
    const url = new URL(req.url);
    const userIdParam = url.searchParams.get('userId');

    // Determine which user's data to fetch
    let targetUserId: string | null = session.user.id;
    if (isAdmin && userIdParam) {
      if (userIdParam === 'all') {
        targetUserId = null; // null means all users
      } else {
        targetUserId = userIdParam;
      }
    }

    console.log('[tasks/history] Fetching for user:', targetUserId ?? 'ALL', 'isAdmin:', isAdmin);

    // Fetch all images for the user (or all users if admin)
    const images = targetUserId
      ? await db.query.generatedImages.findMany({
          where: eq(generatedImages.userId, targetUserId),
          orderBy: [desc(generatedImages.createdAt)],
        })
      : await db.query.generatedImages.findMany({
          orderBy: [desc(generatedImages.createdAt)],
          limit: 200,
        });

    console.log('[tasks/history] Found images:', images.length);

    if (images.length === 0) {
      return NextResponse.json({
        success: true,
        isAdmin,
        history: [],
        users: [],
      });
    }

    // Get unique task IDs
    const taskIds = [...new Set(images.map(img => img.taskId))];
    console.log('[tasks/history] Task IDs:', taskIds);
    
    // Fetch all tasks for these images
    const tasks = await db.query.imageTasks.findMany({
      where: inArray(imageTasks.id, taskIds),
    });
    
    console.log('[tasks/history] Found tasks:', tasks.length);
    console.log('[tasks/history] Tasks:', tasks.map(t => ({ id: t.id, platform: t.platform })));
    
    // Create a map of taskId -> task
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Fetch user info for all relevant users
    const userIds = [...new Set(images.map(img => img.userId))];
    const userList = userIds.length
      ? await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, userIds))
      : [];
    const userMap = new Map(userList.map(u => [u.id, u]));

    const history = images.map(img => ({
      id: img.id,
      imageUrl: img.imageUrl,
      taskId: img.taskId,
      platform: taskMap.get(img.taskId)?.platform || "Unknown",
      specId: taskMap.get(img.taskId)?.specId || null,
      promptPayload: taskMap.get(img.taskId)?.promptPayload || null,
      createdAt: img.createdAt,
      userId: img.userId,
      userName: userMap.get(img.userId)?.name || 'Unknown',
    }));

    console.log('[tasks/history] History items:', history.length);
    console.log('[tasks/history] Platforms:', [...new Set(history.map(h => h.platform))]);

    return NextResponse.json({
      success: true,
      isAdmin,
      history,
      users: userList,
    });
  } catch (error) {
    console.error("Fetch history error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
