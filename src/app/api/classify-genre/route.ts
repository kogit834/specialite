import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: Request) {
  const { title, body, labels } = await request.json();

  if (!labels || labels.length === 0) {
    return NextResponse.json({ labelId: null });
  }

  const labelList = labels.map((l: { id: string; name: string }) => `- ${l.name} (id: ${l.id})`).join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 64,
    messages: [
      {
        role: "user",
        content: `以下のレシピに最も合うラベルのidを1つだけ返してください。どれにも合わない場合は "none" と返してください。idのみを返し、説明は不要です。

料理名: ${title}
レシピ: ${body?.slice(0, 500) ?? ""}

ラベル一覧:
${labelList}`,
      },
    ],
  });

  const text = (message.content[0] as { text: string }).text.trim();
  const matched = labels.find((l: { id: string }) => l.id === text);

  return NextResponse.json({ labelId: matched ? matched.id : null });
}
