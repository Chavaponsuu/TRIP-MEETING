import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-4 flex items-center justify-between max-w-lg mx-auto w-full">
        <span className="text-xl font-bold text-primary">TripMeet</span>
        <div className="flex gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">เข้าสู่ระบบ</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">สมัครสมาชิก</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-lg mx-auto w-full text-center">
        <div className="text-6xl mb-6">🗺️</div>
        <h1 className="text-3xl font-bold text-foreground leading-tight">
          นัดเพื่อนไปเที่ยว<br />ง่ายๆ แค่ปลายนิ้ว
        </h1>
        <p className="text-text-secondary mt-4 text-lg leading-relaxed">
          สร้างทริป → เพื่อนลงวันว่าง → แอปบอกว่าวันไหนดีที่สุด
        </p>

        <div className="grid grid-cols-1 gap-4 mt-10 w-full text-left">
          {[
            { emoji: '📅', title: 'เลือกวันว่าง', desc: 'กดปฏิทินเลือกวันที่ตัวเองว่าง' },
            { emoji: '🏆', title: 'หาวันที่ดีที่สุด', desc: 'heatmap แสดงว่าวันไหนคนว่างมากสุด' },
            { emoji: '🔗', title: 'ชวนเพื่อนง่ายๆ', desc: 'ส่งลิงก์ชวน เพื่อน login แล้วเข้าร่วมได้เลย' },
          ].map(feature => (
            <div key={feature.title} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-border">
              <span className="text-2xl">{feature.emoji}</span>
              <div>
                <p className="font-medium text-foreground">{feature.title}</p>
                <p className="text-sm text-text-secondary">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link href="/register" className="mt-10 w-full">
          <Button size="lg" className="w-full">เริ่มวางแผนทริปฟรี</Button>
        </Link>

        <p className="text-xs text-text-secondary mt-4">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="text-primary hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </main>

      <footer className="py-6 text-center text-xs text-text-secondary">
        TripMeet — นัดเพื่อนไปเที่ยว
      </footer>
    </div>
  )
}
