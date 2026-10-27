import { createRoot } from "react-dom/client";
import { LiquidNavbar, NimbusIcons } from "@/components/ui/liquid-glass-navbar";
import "./index.css";

function LiquidNavbarDemo() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-7 bg-[#DCEBF5] px-4 py-12 text-slate-900">
      <a className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-slate-900" href="/">SINAUUENGLISH / UI EXPERIMENT</a>
      <LiquidNavbar tone="light" defaultActive={0} sound={false} items={[
        { label: "Beranda", href: "/", icon: NimbusIcons.home, fx: "glow" },
        { label: "Ruang belajar", href: "/belajar.html", icon: NimbusIcons.globe, fx: "spin" },
        { label: "Peta materi", href: "/#materi", icon: NimbusIcons.drop, fx: "drop" },
        { label: "Latihan", href: "/#latihan", icon: NimbusIcons.user, fx: "wave" },
      ]} />
      <section className="max-w-md text-center">
        <h1 className="text-2xl font-medium tracking-tight text-slate-900">Liquid Glass Navbar</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Menu ini memakai komponen React yang sama dengan navigasi di beranda SinauuEnglish. Coba pindah menu untuk melihat animasi tetesan dan ripple.</p>
        <a className="mt-5 inline-flex rounded-full border border-slate-400/50 px-4 py-2 text-sm text-slate-700 transition hover:bg-white/60" href="/">Kembali ke beranda</a>
      </section>
    </main>
  );
}
const root = document.getElementById("root");
if (root) createRoot(root).render(<LiquidNavbarDemo />);
