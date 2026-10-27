import { createRoot } from "react-dom/client";
import { LiquidNavbar, NimbusIcons } from "@/components/ui/liquid-glass-navbar";
import "./navbar-overrides.css";

const mount = document.getElementById("liquid-nav-mount");
if (mount) {
  mount.parentElement?.classList.add("has-liquid-nav");
  createRoot(mount).render(
    <LiquidNavbar tone="light" defaultActive={0} sound={false} items={[
      { label: "Pendekatan", href: "/#pendekatan", icon: NimbusIcons.globe, fx: "spin" },
      { label: "Peta materi", href: "/#materi", icon: NimbusIcons.drop, fx: "drop" },
      { label: "Coba latihan", href: "/#latihan", icon: NimbusIcons.plane, fx: "plane" },
    ]} />,
  );
}
