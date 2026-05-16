import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { users, pointTransactions, imageTasks, musicTasks, generatedImages } from '@/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const currentUser = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!currentUser.length || currentUser[0].role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session, userId: session.user.id };
}

// GET /api/admin/point-usage - List point usage/deduction records
export async function GET(request: Request) {
  const authResult = await checkAdmin();
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const taskType = searchParams.get('type') || 'all'; // 'photo' | 'music' | 'all'
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    // Query point transactions of type GENERATE_COST
    const transactions = await db
      .select({
        id: pointTransactions.id,
        userId: pointTransactions.userId,
        amount: pointTransactions.amount,
        type: pointTransactions.type,
        description: pointTransactions.description,
        relatedTaskId: pointTransactions.relatedTaskId,
        createdAt: pointTransactions.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(pointTransactions)
      .leftJoin(users, eq(pointTransactions.userId, users.id))
      .where(eq(pointTransactions.type, 'GENERATE_COST'))
      .orderBy(desc(pointTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    // For each transaction, get task details (image or music)
    let usageList = await Promise.all(transactions.map(async (tx) => {
      let taskDetails: any = {
        taskType: null as string | null,
        platform: null as string | null,
        promptPayload: null,
        costPoints: null,
        taskStatus: null,
        taskCreatedAt: null,
        musicPrompt: null,
        musicTitle: null,
        musicStyle: null,
        generatedCount: 0,
      };

      if (tx.relatedTaskId) {
        // Check imageTasks first
        const imgTask = await db
          .select({
            platform: imageTasks.platform,
            promptPayload: imageTasks.promptPayload,
            costPoints: imageTasks.costPoints,
            status: imageTasks.status,
            createdAt: imageTasks.createdAt,
          })
          .from(imageTasks)
          .where(eq(imageTasks.id, tx.relatedTaskId))
          .limit(1);

        if (imgTask.length > 0) {
          const imgCount = await db
            .select({ count: count() })
            .from(generatedImages)
            .where(eq(generatedImages.taskId, tx.relatedTaskId));

          taskDetails = {
            taskType: 'photo',
            platform: imgTask[0].platform,
            promptPayload: imgTask[0].promptPayload,
            costPoints: imgTask[0].costPoints,
            taskStatus: imgTask[0].status,
            taskCreatedAt: imgTask[0].createdAt,
            generatedCount: imgCount[0]?.count || 0,
          };
        } else {
          // Check musicTasks
          const musicTask = await db
            .select({
              prompt: musicTasks.prompt,
              title: musicTasks.title,
              style: musicTasks.style,
              costPoints: musicTasks.costPoints,
              status: musicTasks.status,
              createdAt: musicTasks.createdAt,
              resultData: musicTasks.resultData,
            })
            .from(musicTasks)
            .where(eq(musicTasks.id, tx.relatedTaskId))
            .limit(1);

          if (musicTask.length > 0) {
            // Count generated outputs from resultData
            let generatedCount = 0;
            if (musicTask[0].resultData) {
              const data = musicTask[0].resultData as any;
              if (Array.isArray(data)) {
                generatedCount = data.length;
              } else if (data.clips) {
                generatedCount = Array.isArray(data.clips) ? data.clips.length : 0;
              }
            }

            taskDetails = {
              taskType: 'music',
              musicPrompt: musicTask[0].prompt,
              musicTitle: musicTask[0].title,
              musicStyle: musicTask[0].style,
              costPoints: musicTask[0].costPoints,
              taskStatus: musicTask[0].status,
              taskCreatedAt: musicTask[0].createdAt,
              generatedCount,
            };
          }
        }
      }

      return {
        ...tx,
        ...taskDetails,
      };
    }));

    // Filter by task type
    if (taskType !== 'all') {
      usageList = usageList.filter(item => item.taskType === taskType);
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      usageList = usageList.filter(item =>
        item.userName?.toLowerCase().includes(q) ||
        item.userEmail?.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.relatedTaskId?.toLowerCase().includes(q)
      );
    }

    // Stats
    const totalResult = await db
      .select({ count: count() })
      .from(pointTransactions)
      .where(eq(pointTransactions.type, 'GENERATE_COST'));

    const totalPointsResult = await db
      .select({ total: sql<number>`COALESCE(sum(${pointTransactions.amount}), 0)` })
      .from(pointTransactions)
      .where(eq(pointTransactions.type, 'GENERATE_COST'));

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const todayStatsResult = await db
      .select({
        count: count(),
        total: sql<number>`COALESCE(sum(${pointTransactions.amount}), 0)`
      })
      .from(pointTransactions)
      .where(and(
        eq(pointTransactions.type, 'GENERATE_COST'),
        sql`${pointTransactions.createdAt} >= ${todayISO}::timestamp`
      ));

    const totalUsage = totalResult[0].count;
    const totalPoints = Math.abs(Number(totalPointsResult[0]?.total) || 0);
    const todayPoints = Math.abs(Number(todayStatsResult[0]?.total) || 0);
    const todayUsage = todayStatsResult[0]?.count || 0;

    const stats = {
      totalUsage,
      totalPointsUsed: totalPoints,
      todayPointsUsed: todayPoints,
      todayUsage,
      averageCostPerTask: totalUsage > 0 ? totalPoints / totalUsage : 0,
    };

    const helpDate = (date: Date | number | null | undefined): string | null => {
      if (!date) return null;
      if (typeof date === 'number') {
        const timestamp = date < 1e12 ? date * 1000 : date;
        return new Date(timestamp).toISOString();
      }
      if (date instanceof Date) {
        const year = date.getFullYear();
        if (year > 2100) {
          const originalMs = Math.floor(date.getTime() / 1000);
          return new Date(originalMs).toISOString();
        }
        return date.toISOString();
      }
      return null;
    };

    return NextResponse.json({
      usageRecords: usageList.map(item => ({
        ...item,
        createdAt: helpDate(item.createdAt),
        taskCreatedAt: helpDate(item.taskCreatedAt),
      })),
      stats,
      pagination: {
        page,
        limit,
        total: totalUsage,
        totalPages: Math.ceil(totalUsage / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching point usage:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
