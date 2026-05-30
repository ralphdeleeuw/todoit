import { getFullUser } from "@/lib/dal";
import { calcLevel } from "@/lib/arcade";
import { PushSubscribeButton } from "@/components/notifications/PushSubscribeButton";
import { DailyReminderToggle } from "./DailyReminderToggle";
import { SignOutButton } from "./SignOutButton";
import { ArcadeBottomNav } from "@/components/arcade/ArcadeBottomNav";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

export const metadata = { title: "Instellingen – Todoit" };
export const dynamic = "force-dynamic";

function ArcadeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 mb-5">
      <p className="text-[10px] font-bold tracking-widest uppercase text-[var(--arc-muted)] mb-2">{title}</p>
      <div
        className="rounded-2xl overflow-hidden divide-y"
        style={{ background: "var(--arc-panel)", borderColor: "var(--arc-border)", border: "1px solid var(--arc-border)" }}
      >
        {children}
      </div>
    </section>
  );
}

function SettingRow({ icon, label, sub, right }: { icon: string; label: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderColor: "var(--arc-border)" }}>
      <span className="text-xl w-6 text-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {sub && <p className="text-[10px] text-[var(--arc-muted)] mt-0.5">{sub}</p>}
      </div>
      {right ?? <ChevronRight className="w-4 h-4 text-[var(--arc-muted-deep)] shrink-0" />}
    </div>
  );
}

export default async function SettingsPage() {
  const user = await getFullUser();
  const level = calcLevel(user.xp ?? 0);
  const initial = (user.name ?? user.email ?? "?")[0].toUpperCase();

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--arc-bg)" }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-4 pb-4">
        <Link href="/dashboard" className="p-2 rounded-xl text-[var(--arc-muted)] hover:text-white" style={{ background: "var(--arc-panel)" }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-black text-white">Instellingen</h1>
      </header>

      {/* Profile card */}
      <div
        className="mx-4 mb-5 p-4 rounded-2xl flex items-center gap-4"
        style={{ background: "var(--arc-panel)", border: "1px solid var(--arc-border-str)" }}
      >
        <AvatarUpload currentImage={user.image ?? null} initial={initial} size={56} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white truncate">{user.name ?? "Naamloos"}</p>
          <p className="text-xs text-[var(--arc-muted)] truncate">{user.email}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--gold)" }}>
            Level {level} · {user.role === "PARENT" ? "Ouder" : "Kind"}
          </p>
        </div>
        <p className="text-[10px] text-[var(--arc-muted)] shrink-0">Tik om<br/>te wijzigen</p>
      </div>

      {/* Notifications */}
      <ArcadeSection title="Notificaties">
        <div className="px-4 py-3.5">
          <PushSubscribeButton />
        </div>
        <div className="px-4 py-3.5" style={{ borderTop: "1px solid var(--arc-border)" }}>
          <DailyReminderToggle initialEnabled={user.dailyReminderEnabled} />
        </div>
      </ArcadeSection>

      {/* Lijsten */}
      <ArcadeSection title="Lijsten">
        <Link href="/lists">
          <SettingRow icon="📋" label="Beheer lijsten" sub="Aanmaken, bewerken, verwijderen" />
        </Link>
      </ArcadeSection>

      {/* Squad */}
      {user.role === "PARENT" && (
        <ArcadeSection title="Squad">
          <Link href="/family">
            <SettingRow icon="👥" label="Gezinsleden" sub="Rollen en uitnodigingen beheren" />
          </Link>
        </ArcadeSection>
      )}

      {/* About */}
      <ArcadeSection title="Over">
        <SettingRow icon="ℹ️" label="Versie" sub="1.0.0" right={<span className="text-[10px] text-[var(--arc-muted)]">1.0.0</span>} />
      </ArcadeSection>

      {/* Sign out */}
      <div className="px-4 mt-2">
        <SignOutButton />
      </div>

      <div className="md:hidden">
        <ArcadeBottomNav />
      </div>
    </div>
  );
}
