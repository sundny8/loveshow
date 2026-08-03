import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createGenerationTask } from "@/lib/services/ai-pipeline";
import {
  combineUserText,
  moderatePrompt,
  moderationErrorResponse,
} from "@/lib/moderation";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { platform, prompt, imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Source image is required" }, { status: 400 });
    }

    const moderation = await moderatePrompt({
      prompt: combineUserText([
        `Generate marketplace image for platform=${
          typeof platform === "string" ? platform : "TEMU"
        }`,
        typeof prompt === "string" ? prompt : undefined,
      ]),
      externalId: `user_${session.user.id}:task`,
    });
    if (!moderation.ok) return moderationErrorResponse(moderation);

    // Waffo has explicitly allowed the request; task creation may now charge.
    try {
      const taskId = await createGenerationTask({
        userId: session.user.id,
        platform: platform || "TEMU",
        prompt: prompt || "",
        originalImageUrl: imageUrl,
      });

      // 2. Here we would trigger the actual AI engine (e.g., via queue or direct API)
      // For now, we mock a quick completion
      // In a real async flow, this would return the taskId and the UI would poll/webhook
      
      return NextResponse.json({
        success: true,
        taskId,
        message: "Task started successfully",
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Task generation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
