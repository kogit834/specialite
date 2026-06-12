import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: Request) {
  const { transcript, title } = await request.json();

  if (!transcript?.trim()) {
    return NextResponse.json({ body: "" });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `以下の音声内容をもとに、料理レシピとして整形してください。
「材料」と「手順」のセクションに分けて、箇条書きでまとめてください。
音声から読み取れる情報だけを使い、不明な点は補わないでください。
前置きや説明は不要です。レシピ本文のみを返してください。

料理名: ${title || "不明"}
音声内容: ${transcript}`,
      },
    ],
  });

  const body = (message.content[0] as { text: string }).text.trim();
  return NextResponse.json({ body });
}
