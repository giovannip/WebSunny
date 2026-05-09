import { NextResponse } from "next/server";
import { z } from "zod";

import { reactionAnimationSchema } from "@/lib/character-animations";
import {
  CHARACTER_SYSTEM_PROMPT,
  createGroqClient,
  getGroqModel,
} from "@/lib/groq";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(12000),
});

const requestSchema = z
  .object({
    message: z.string().min(1).max(12000).optional(),
    messages: z.array(chatMessageSchema).max(50).optional(),
  })
  .refine((data) => data.message != null || (data.messages?.length ?? 0) > 0, {
    message: "Provide either `message` or non-empty `messages`.",
  });

const groqReplySchema = z.object({
  reply: z.string().min(1),
  animation: reactionAnimationSchema,
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { message, messages: history } = parsed.data;

  const dialogue: { role: "user" | "assistant"; content: string }[] =
    history ??
    (message != null
      ? [{ role: "user" as const, content: message }]
      : []);

  let client;
  try {
    client = createGroqClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Configuration error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  try {
    const completion = await client.chat.completions.create({
      model: getGroqModel(),
      messages: [
        { role: "system", content: CHARACTER_SYSTEM_PROMPT },
        ...dialogue,
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json(
        { error: "Empty response from model" },
        { status: 502 },
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Model returned invalid JSON", raw },
        { status: 502 },
      );
    }

    const replyParsed = groqReplySchema.safeParse(json);
    if (!replyParsed.success) {
      return NextResponse.json(
        {
          error: "Model JSON did not match expected shape",
          details: replyParsed.error.flatten(),
          raw: json,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      reply: replyParsed.data.reply,
      animation: replyParsed.data.animation,
    });
  } catch (e) {
    const messageText =
      e instanceof Error ? e.message : "Groq request failed";
    return NextResponse.json({ error: messageText }, { status: 502 });
  }
}
