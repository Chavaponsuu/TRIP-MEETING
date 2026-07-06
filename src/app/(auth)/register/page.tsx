"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getRandomAvatarColor } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const avatarColor = getRandomAvatarColor();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, avatar_color: avatarColor },
      },
    });

    if (signUpError) {
      console.log(signUpError);
      setError(signUpError.message);
      setError(
        signUpError.message === "User already registered"
          ? "อีเมลนี้ถูกใช้งานแล้ว"
          : "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่",
      );
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        name,
        avatar_color: avatarColor,
      });
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary">
            TripMeet
          </Link>
          <p className="text-text-secondary mt-2">
            สร้างบัญชีเพื่อเริ่มวางแผนทริป
          </p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <Input
              id="name"
              label="ชื่อ"
              type="text"
              placeholder="ชื่อของคุณ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="email"
              label="อีเมล"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="รหัสผ่าน"
              type="password"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              สมัครสมาชิก
            </Button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            มีบัญชีอยู่แล้ว?{" "}
            <Link
              href={`/login${redirect !== "/dashboard" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="text-primary font-medium hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          กำลังโหลด...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
