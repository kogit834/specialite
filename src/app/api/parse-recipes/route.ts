import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// メモ全文をレシピ単位に構造化するためのツール定義（structured output）
const tool: Anthropic.Tool = {
  name: "register_recipes",
  description: "メモから抽出した複数のレシピを登録する",
  input_schema: {
    type: "object",
    properties: {
      recipes: {
        type: "array",
        description: "抽出したレシピの配列。元の記載順を維持する。",
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "料理名（簡潔に）。多くの場合そのレシピの1行目。",
            },
            body: {
              type: "string",
              description:
                "材料・手順などの本文。料理名の行は含めない。元の改行や箇条書きはできるだけ保持する。",
            },
          },
          required: ["title", "body"],
        },
      },
    },
    required: ["recipes"],
  },
};

type ParsedRecipe = { title: string; body: string };

export async function POST(request: Request) {
  const { text } = await request.json();

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ recipes: [] });
  }

  // 長文対策の上限（おおよそのトークン保護）
  const input = text.slice(0, 20000);

  // APIキー未設定を明示的に検出（未設定だと messages.create() が即例外を投げる）
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[parse-recipes] ANTHROPIC_API_KEY が設定されていません");
    return NextResponse.json(
      { error: "サーバーにAPIキー(ANTHROPIC_API_KEY)が設定されていません" },
      { status: 500 }
    );
  }

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      tools: [tool],
      tool_choice: { type: "tool", name: "register_recipes" },
      messages: [
        {
          role: "user",
          content: `次のテキストは、スマホのメモ帳に書きためた複数の料理レシピです。これを1レシピずつに分割し、それぞれ「料理名(title)」と「本文(body)」に構造化してください。

ルール（ゆるい規則性があります）:
- 各レシピのまとまりの1行目が料理名であることが多いです。
- 空行や「---」「===」などの区切りでレシピが分かれていることがあります。
- 区切りが曖昧な場合は内容から判断して自然なまとまりに分けてください。
- 本文には材料・手順をそのまま残し、料理名の行は本文に含めないでください。
- 元の改行・箇条書きはできるだけ保持してください。
- レシピが1つだけ、または区切りが無い場合は1件として返してください。

--- メモ本文 ---
${input}`,
        },
      ],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    const recipes = (toolUse?.input as { recipes?: ParsedRecipe[] })?.recipes ?? [];

    // 念のため空タイトル/空本文を除外
    const cleaned = recipes
      .map((r) => ({ title: (r.title ?? "").trim(), body: (r.body ?? "").trim() }))
      .filter((r) => r.title || r.body);

    return NextResponse.json({ recipes: cleaned });
  } catch (err) {
    // 実際のエラー内容をログとレスポンスに出して原因を特定できるようにする
    const detail =
      err instanceof Anthropic.APIError
        ? `Anthropic APIエラー (${err.status}): ${err.message}`
        : (err as Error)?.message ?? "不明なエラー";
    console.error("[parse-recipes] 解析失敗:", detail);
    return NextResponse.json({ error: `解析に失敗しました: ${detail}` }, { status: 500 });
  }
}
