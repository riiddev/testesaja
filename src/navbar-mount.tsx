import { createRoot } from "react-dom/client";
import { LiquidNavbar, NimbusIcons } from "@/components/ui/liquid-glass-navbar";
import "./navbar-overrides.css";

const mount = document.getElementById("liquid-nav-mount");
if (mount) {
  const navContainer = mount.parentElement;
  navContainer?.classList.add("has-liquid-nav");

  // Capture at document level so this also works for SVG icons inside React links.
  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    if (!target?.closest?.(".nimbus-item")) return;
    const container = document.getElementById("primary-nav");
    container?.classList.remove("is-open");
    const menuToggle = document.getElementById("menu-toggle");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Buka navigasi");
  }, true);

  createRoot(mount).render(
    <LiquidNavbar tone="light" defaultActive={0} sound={false} items={[
      { label: "Pendekatan", href: "/#pendekatan", icon: NimbusIcons.globe, fx: "spin" },
      { label: "Peta materi", href: "/#materi", icon: NimbusIcons.drop, fx: "drop" },
      { label: "Coba latihan", href: "/#latihan", icon: NimbusIcons.plane, fx: "plane" },
    ]} />,
  );
}
