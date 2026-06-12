"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Camera, ImagePlus, X, Sparkles, Mic, MicOff } from "lucide-react";

type Genre = { id: string; name: string };
type Recipe = { id: string; title: string; body: string; genre_id: string | null };
type ExistingPhoto = { id: string; storage_path: string; url: string; caption: string | null; taken_on: string | null };

type NewPhoto = {
  file: File;
  preview: string;
  caption: string;
};

export function RecipeForm({
  householdId,
  userId,
  genres,
  recipe,
  existingPhotos = [],
}: {
  householdId: string;
  userId: string;
  genres: Genre[];
  recipe?: Recipe;
  existingPhotos?: ExistingPhoto[];
}) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [body, setBody] = useState(recipe?.body ?? "");
  const [genreId, setGenreId] = useState<string>(recipe?.genre_id ?? "");
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    setSpeechSupported(
      typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }, []);

  const remainingExisting = existingPhotos.filter((p) => !removedPhotoIds.includes(p.id));

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const compressed = await Promise.all(
      files.map(async (f) => {
        const comp = await imageCompression(f, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1280,
          useWebWorker: true,
        });
        return {
          file: comp,
          preview: URL.createObjectURL(comp),
          caption: "",
        };
      })
    );
    setNewPhotos((prev) => [...prev, ...compressed]);
    e.target.value = "";
  }

  function toggleRecording() {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setBody((prev) => (prev ? prev + "\n" + transcript : transcript));
    };

    recognition.onend = () => setRecording(false);
    recognition.onerror = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  async function handleClassify() {
    if (!title && !body) return;
    setClassifying(true);
    try {
      const res = await fetch("/api/classify-genre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, genres }),
      });
      const data = await res.json();
      if (data.genreId) setGenreId(data.genreId);
    } catch {
      // 判定失敗は無視
    } finally {
      setClassifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    try {
      let recipeId = recipe?.id;

      if (recipe) {
        await supabase
          .from("recipes")
          .update({ title, body, genre_id: genreId || null })
          .eq("id", recipe.id);

        if (removedPhotoIds.length > 0) {
          const toDelete = existingPhotos.filter((p) => removedPhotoIds.includes(p.id));
          await supabase.storage
            .from("recipe-photos")
            .remove(toDelete.map((p) => p.storage_path));
          await supabase.from("recipe_photos").delete().in("id", removedPhotoIds);
        }
      } else {
        const { data, error: rErr } = await supabase
          .from("recipes")
          .insert({ household_id: householdId, title, body, genre_id: genreId || null, created_by: userId })
          .select("id")
          .single();
        if (rErr || !data) throw new Error("レシピ保存失敗");
        recipeId = data.id;
      }

      for (const p of newPhotos) {
        const ext = p.file.name.split(".").pop() ?? "jpg";
        const path = `${householdId}/${recipeId}/${Date.now()}.${ext}`;
        await supabase.storage.from("recipe-photos").upload(path, p.file);
        await supabase.from("recipe_photos").insert({
          recipe_id: recipeId,
          storage_path: path,
          caption: p.caption || null,
        });
      }

      router.push(`/recipes/${recipeId}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message ?? "保存に失敗しました");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">料理名 *</Label>
        <Input
          id="title"
          placeholder="例: 肉じゃが"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="body">レシピ本文</Label>
          {speechSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                recording
                  ? "bg-destructive/10 text-destructive animate-pulse"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {recording ? <MicOff size={13} /> : <Mic size={13} />}
              {recording ? "停止" : "音声入力"}
            </button>
          )}
        </div>
        <Textarea
          id="body"
          placeholder={recording ? "話してください…" : "材料・手順を入力..."}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
        />
        {recording && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-destructive animate-pulse" />
            録音中… 停止ボタンで終了します
          </p>
        )}
      </div>

      {genres.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>ジャンル</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleClassify}
              disabled={classifying || (!title && !body)}
            >
              {classifying ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              AIで判定
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGenreId("")}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                !genreId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input hover:bg-muted"
              }`}
            >
              未分類
            </button>
            {genres.map((g) => (
              <button
                type="button"
                key={g.id}
                onClick={() => setGenreId(g.id)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  genreId === g.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input hover:bg-muted"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>写真</Label>
        <div className="grid grid-cols-3 gap-2">
          {remainingExisting.map((p) => (
            <div key={p.id} className="relative aspect-square">
              <Image src={p.url} alt="" fill className="object-cover rounded-md" sizes="120px" />
              <button
                type="button"
                onClick={() => setRemovedPhotoIds((prev) => [...prev, p.id])}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {newPhotos.map((p, i) => (
            <div key={i} className="relative aspect-square">
              <Image src={p.preview} alt="" fill className="object-cover rounded-md" sizes="120px" />
              <button
                type="button"
                onClick={() => setNewPhotos((prev) => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 transition-colors"
          >
            <Camera size={22} />
            <span className="text-xs">カメラ</span>
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-muted-foreground/30 rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 transition-colors"
          >
            <ImagePlus size={22} />
            <span className="text-xs">ライブラリ</span>
          </button>
        </div>
        {/* カメラ専用 */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        {/* ローカルファイル選択 */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            保存中...
          </>
        ) : recipe ? (
          "変更を保存"
        ) : (
          "レシピを保存"
        )}
      </Button>
    </form>
  );
}
