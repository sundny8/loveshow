import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/db';
import { imageTasks, musicTasks, loveColumnRecords, users } from '@/db/schema';
import { eq, sql, count, desc, and } from 'drizzle-orm';

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

// GET /api/admin/tasks - List all creative engine tasks
export async function GET(request: Request) {
  const authResult = await checkAdmin();
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status') || 'all';
  // 'photo' (证件照) | 'portrait' (肖像) | 'music' | 'love-column' (520专栏) | 'all'
  const taskType = searchParams.get('type') || 'all';

  try {
    // ========== Image Tasks (证件照 + 肖像) ==========
    let imgTasks: any[] = [];
    let imgTotal = 0;
    const shouldFetchPhoto = taskType === 'all' || taskType === 'photo';
    const shouldFetchPortrait = taskType === 'all' || taskType === 'portrait';
    const shouldFetchImg = shouldFetchPhoto || shouldFetchPortrait;

    if (shouldFetchImg) {
      // Build where conditions for imageTasks
      const conditions: any[] = [];

      // Platform filter
      if (taskType === 'photo') {
        conditions.push(eq(imageTasks.platform, 'photo'));
      } else if (taskType === 'portrait') {
        conditions.push(eq(imageTasks.platform, 'portrait'));
      }
      // taskType === 'all' => no platform filter

      // Status filter
      if (status !== 'all') {
        const dbStatus = status === 'pending' ? 'PENDING'
          : status === 'processing' ? 'PROCESSING'
          : status === 'completed' ? 'COMPLETED'
          : status === 'failed' ? 'FAILED'
          : status.toUpperCase();
        conditions.push(eq(imageTasks.status, dbStatus));
      }

      const imgWhere = conditions.length > 0 ? and(...conditions) : undefined;

      const imgCountResult = await db.select({ count: count() }).from(imageTasks).where(imgWhere || sql`1=1`);
      imgTotal = imgCountResult[0].count;

      const imgResult = await db
        .select({
          id: imageTasks.id,
          userId: imageTasks.userId,
          status: imageTasks.status,
          platform: imageTasks.platform,
          promptPayload: imageTasks.promptPayload,
          originalImageUrl: imageTasks.originalImageUrl,
          costPoints: imageTasks.costPoints,
          aiProvider: imageTasks.aiProvider,
          errorMessage: imageTasks.errorMessage,
          createdAt: imageTasks.createdAt,
          completedAt: imageTasks.completedAt,
        })
        .from(imageTasks)
        .where(imgWhere || sql`1=1`)
        .orderBy(desc(imageTasks.createdAt))
        .limit(limit * 3)
        .offset((page - 1) * limit);

      imgTasks = imgResult.map(t => ({
        ...t,
        taskType: t.platform === 'portrait' ? 'portrait' : 'photo',
        duration: t.createdAt && t.completedAt
          ? (t.completedAt as Date).getTime() - (t.createdAt as Date).getTime()
          : null,
      }));
    }

    // ========== Music Tasks (AI音乐制作) ==========
    let musicTaskList: any[] = [];
    let musicTotal = 0;
    const shouldFetchMusic = taskType === 'all' || taskType === 'music';

    if (shouldFetchMusic) {
      const conditions: any[] = [];

      if (status !== 'all') {
        const dbStatus = status === 'pending' ? 'PENDING'
          : status === 'processing' ? 'GENERATING'
          : status === 'completed' ? 'SUCCESS'
          : status === 'failed' ? 'FAILED'
          : status.toUpperCase();
        conditions.push(eq(musicTasks.status, dbStatus));
      }

      const musicWhere = conditions.length > 0 ? and(...conditions) : undefined;

      const musicCountResult = await db.select({ count: count() }).from(musicTasks).where(musicWhere || sql`1=1`);
      musicTotal = musicCountResult[0].count;

      const musicResult = await db
        .select({
          id: musicTasks.id,
          userId: musicTasks.userId,
          status: musicTasks.status,
          sunoTaskId: musicTasks.sunoTaskId,
          prompt: musicTasks.prompt,
          style: musicTasks.style,
          title: musicTasks.title,
          costPoints: musicTasks.costPoints,
          errorMessage: musicTasks.errorMessage,
          createdAt: musicTasks.createdAt,
          completedAt: musicTasks.completedAt,
        })
        .from(musicTasks)
        .where(musicWhere || sql`1=1`)
        .orderBy(desc(musicTasks.createdAt))
        .limit(limit * 3)
        .offset((page - 1) * limit);

      musicTaskList = musicResult.map(t => ({
        ...t,
        taskType: 'music' as const,
        duration: t.createdAt && t.completedAt
          ? (t.completedAt as Date).getTime() - (t.createdAt as Date).getTime()
          : null,
      }));
    }

    // ========== Love Column Records (520专栏) ==========
    let loveColumnList: any[] = [];
    let loveColumnTotal = 0;
    const shouldFetchLoveColumn = taskType === 'all' || taskType === 'love-column';

    if (shouldFetchLoveColumn) {
      // Love column records don't have status (only created on success)
      // If filtering by status, only show them for 'completed' or 'all'
      if (status === 'all' || status === 'completed') {
        const loveCountResult = await db.select({ count: count() }).from(loveColumnRecords);
        loveColumnTotal = loveCountResult[0].count;

        const loveResult = await db
          .select({
            id: loveColumnRecords.id,
            userId: loveColumnRecords.userId,
            type: loveColumnRecords.type,
            payload: loveColumnRecords.payload,
            imageUrls: loveColumnRecords.imageUrls,
            creditsUsed: loveColumnRecords.creditsUsed,
            createdAt: loveColumnRecords.createdAt,
          })
          .from(loveColumnRecords)
          .orderBy(desc(loveColumnRecords.createdAt))
          .limit(limit * 3)
          .offset((page - 1) * limit);

        loveColumnList = loveResult.map(t => ({
          ...t,
          taskType: 'love-column' as const,
          status: 'COMPLETED', // love column records are always completed
          costPoints: t.creditsUsed,
          duration: null,
          completedAt: t.createdAt, // same as created since it's instant
          errorMessage: null,
        }));
      }
    }

    // ========== Merge and sort ==========
    const allTasks = [...imgTasks, ...musicTaskList, ...loveColumnList]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    // ========== Fetch user info ==========
    const userIds = [...new Set(allTasks.map(t => t.userId))];
    const userMap = new Map<string, { name: string; email: string }>();
    for (const uid of userIds) {
      const [u] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, uid))
        .limit(1);
      if (u) userMap.set(u.id, { name: u.name || '', email: u.email || '' });
    }

    // ========== Normalize status ==========
    const normalizeStatus = (raw: string, type: string) => {
      if (type === 'music') {
        if (raw === 'GENERATING') return 'processing';
        if (raw === 'SUCCESS') return 'completed';
      }
      return raw.toLowerCase();
    };

    // Love column sub-type labels
    const loveColumnTypeLabel = (subType: string) => {
      const labels: Record<string, string> = {
        'copy': '520文案',
        'couple-photo': '情侣写真',
        'couple-avatar': '情侣大头贴',
        'analysis': '情感分析',
        'memoir': '恋爱回忆录',
        'music': '情侣音乐',
      };
      return labels[subType] || subType;
    };

    const tasks = allTasks.map(t => ({
      id: t.id,
      userId: t.userId,
      userName: userMap.get(t.userId)?.name || 'Unknown',
      userEmail: userMap.get(t.userId)?.email || '',
      taskType: t.taskType,
      status: normalizeStatus(t.status, t.taskType),
      dbStatus: t.status,
      platform: t.taskType === 'photo' ? 'photo'
        : t.taskType === 'portrait' ? 'portrait'
        : t.taskType === 'music' ? 'music'
        : 'love-column',
      // Photo/Portrait fields
      promptPayload: t.taskType === 'photo' || t.taskType === 'portrait' ? t.promptPayload : null,
      originalImageUrl: t.originalImageUrl || null,
      // Music fields
      musicPrompt: t.taskType === 'music' ? t.prompt : null,
      musicTitle: t.taskType === 'music' ? t.title : null,
      musicStyle: t.taskType === 'music' ? t.style : null,
      // Love column fields
      loveColumnType: t.taskType === 'love-column' ? t.type : null,
      loveColumnTypeLabel: t.taskType === 'love-column' ? loveColumnTypeLabel(t.type) : null,
      loveColumnImageUrls: t.taskType === 'love-column' ? t.imageUrls : null,
      // Common fields
      costPoints: t.costPoints,
      aiProvider: t.taskType === 'photo' || t.taskType === 'portrait' ? (t.aiProvider || '-')
        : t.taskType === 'music' ? 'Suno'
        : 'Gemini',
      errorMessage: t.errorMessage,
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
      completedAt: t.completedAt instanceof Date ? t.completedAt.toISOString() : t.completedAt,
      duration: t.duration,
    }));

    // ========== Stats ==========
    // Image tasks stats (both photo and portrait)
    const imgPending = (await db.select({ count: count() }).from(imageTasks).where(eq(imageTasks.status, 'PENDING')))[0].count;
    const imgProcessing = (await db.select({ count: count() }).from(imageTasks).where(eq(imageTasks.status, 'PROCESSING')))[0].count;
    const imgCompleted = (await db.select({ count: count() }).from(imageTasks).where(eq(imageTasks.status, 'COMPLETED')))[0].count;
    const imgFailed = (await db.select({ count: count() }).from(imageTasks).where(eq(imageTasks.status, 'FAILED')))[0].count;

    // Music tasks stats
    const musicPending = (await db.select({ count: count() }).from(musicTasks).where(eq(musicTasks.status, 'PENDING')))[0].count;
    const musicProcessing = (await db.select({ count: count() }).from(musicTasks).where(eq(musicTasks.status, 'GENERATING')))[0].count;
    const musicCompleted = (await db.select({ count: count() }).from(musicTasks).where(eq(musicTasks.status, 'SUCCESS')))[0].count;
    const musicFailed = (await db.select({ count: count() }).from(musicTasks).where(eq(musicTasks.status, 'FAILED')))[0].count;

    // Love column stats (all are completed)
    const loveColumnCompleted = (await db.select({ count: count() }).from(loveColumnRecords))[0].count;

    const totalTasks = imgTotal + musicTotal + loveColumnTotal;
    const totalPages = Math.max(1, Math.ceil(totalTasks / limit));

    return NextResponse.json({
      tasks,
      stats: {
        total: (imgPending + imgProcessing + imgCompleted + imgFailed) + (musicPending + musicProcessing + musicCompleted + musicFailed) + loveColumnCompleted,
        pending: imgPending + musicPending,
        processing: imgProcessing + musicProcessing,
        completed: imgCompleted + musicCompleted + loveColumnCompleted,
        failed: imgFailed + musicFailed,
      },
      pagination: {
        page,
        limit,
        total: totalTasks,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching admin tasks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
