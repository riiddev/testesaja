import { createRoot } from "react-dom/client";
import { LiquidNavbar, NimbusIcons } from "@/components/ui/liquid-glass-navbar";
import "./navbar-overrides.css";

const mount = document.getElementById("liquid-nav-mount");
if (mount) {
  const navContainer = mount.parentElement;
  navContainer?.classList.add("has-liquid-nav");

  // Close the legacy mobile drawer when a React-rendered navbar link is chosen.
  navContainer?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".nimbus-item")) return;
    navContainer.classList.remove("is-open");
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
