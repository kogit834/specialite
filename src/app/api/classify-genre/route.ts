import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function POST(request: Request) {
  const { title, body, genres } = await request.json();

  if (!genres || genres.length === 0) {
    return NextResponse.json({ genreId: null });
  }

  const genreList = genres.map((g: { id: string; name: string }) => `- ${g.name} (id: ${g.id})`).join("\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 64,
    messages: [
      {
        role: "user",
        content: `以下のレシピに最も合うジャンルのidを1つだけ返してください。どれにも合わない場合は "none" と返してください。idのみを返し、説明は不要です。

料理名: ${title}
レシピ: ${body?.slice(0, 500) ?? ""}

ジャンル一覧:
${genreList}`,
      },
    ],
  });

  const text = (message.content[0] as { text: string }).text.trim();
  const matched = genres.find((g: { id: string }) => g.id === text);

  return NextResponse.json({ genreId: matched ? matched.id : null });
}
