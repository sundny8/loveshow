import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { processRecharge } from "@/lib/services/billing";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amountCents, planType } = body;

    // In a real scenario, this would be called after a successful Stripe payment callback
    // For now, we allow trigger mock recharge
    const orderId = await processRecharge({
      userId: session.user.id,
      amountCents: amountCents || 1000,
      points: planType === "Growth Pack" ? 200 : 1500,
      planType: planType || "Growth Pack",
    });

    return NextResponse.json({
      success: true,
      orderId,
      message: "Recharge successful",
    });
  } catch (error) {
    console.error("Recharge failed:", error);
    return NextResponse.json({ error: "Billing Error" }, { status: 500 });
  }
}
