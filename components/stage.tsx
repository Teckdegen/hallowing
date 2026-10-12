import type { SceneId } from "@/lib/data";

type Panel = {
  l: string;
  t: string;
  w: string;
  h: string;
  bg: string;
  radius?: string;
};

type Spec = {
  bg: string;
  glow: string;
  panels: Panel[];
};

const warm = "linear-gradient(180deg, rgba(232,120,58,0.5), rgba(40,18,8,0.12))";
const cold = "linear-gradient(180deg, rgba(186,198,206,0.28), rgba(10,14,16,0.15))";
const wood = "#161310";

const sceneArt: Record<SceneId, Spec> = {
  manor: {
    bg: "linear-gradient(180deg, #14110e 0%, #090909 100%)",
    glow: "radial-gradient(circle at 30% 42%, rgba(232,120,58,0.2), transparent 26%)",
    panels: [
      { l: "16%", t: "18%", w: "16%", h: "58%", bg: warm },
      { l: "34%", t: "18%", w: "5%", h: "58%", bg: wood },
      { l: "52%", t: "28%", w: "14%", h: "42%", bg: "linear-gradient(180deg, rgba(232,120,58,0.22), rgba(16,12,10,0.4))" },
    ],
  },
  arcade: {
    bg: "linear-gradient(180deg, #120d0c 0%, #080808 100%)",
    glow: "radial-gradient(circle at 50% 48%, rgba(140,32,18,0.28), transparent 32%)",
    panels: [
      { l: "18%", t: "22%", w: "64%", h: "46%", bg: "#070606" },
      { l: "22%", t: "26%", w: "56%", h: "38%", bg: "linear-gradient(180deg, rgba(120,28,18,0.55), #0c0908)" },
    ],
  },
  gate: {
    bg: "linear-gradient(180deg, #0d1012 0%, #080808 100%)",
    glow: "radial-gradient(circle at 50% 30%, rgba(180,192,198,0.12), transparent 28%)",
    panels: [
      { l: "28%", t: "14%", w: "4%", h: "72%", bg: "#1a1e20" },
      { l: "68%", t: "14%", w: "4%", h: "72%", bg: "#1a1e20" },
      { l: "28%", t: "18%", w: "44%", h: "3%", bg: "#1a1e20" },
      { l: "42%", t: "36%", w: "16%", h: "28%", bg: cold },
    ],
  },
  archive: {
    bg: "linear-gradient(180deg, #12100e 0%, #080808 100%)",
    glow: "radial-gradient(circle at 70% 40%, rgba(232,120,58,0.1), transparent 24%)",
    panels: [
      { l: "14%", t: "16%", w: "28%", h: "68%", bg: "#141210" },
      { l: "18%", t: "28%", w: "20%", h: "3%", bg: "#2a241c" },
      { l: "18%", t: "40%", w: "20%", h: "3%", bg: "#2a241c" },
      { l: "18%", t: "52%", w: "20%", h: "3%", bg: "#2a241c" },
      { l: "52%", t: "20%", w: "30%", h: "60%", bg: "#100e0c" },
      { l: "58%", t: "28%", w: "18%", h: "36%", bg: "#d7d0c4" },
    ],
  },
  set: {
    bg: "linear-gradient(180deg, #100e0c 0%, #080808 100%)",
    glow: "radial-gradient(circle at 68% 28%, rgba(232,120,58,0.28), transparent 18%)",
    panels: [
      { l: "62%", t: "18%", w: "16%", h: "16%", bg: "radial-gradient(circle, rgba(232,120,58,0.75), rgba(232,120,58,0.05) 70%)", radius: "999px" },
      { l: "69%", t: "32%", w: "1.5%", h: "42%", bg: "#3a3228" },
      { l: "12%", t: "58%", w: "40%", h: "22%", bg: "#16130f" },
    ],
  },
  street: {
    bg: "linear-gradient(180deg, #10100f 0%, #080808 78%)",
    glow: "radial-gradient(circle at 20% 50%, rgba(232,120,58,0.12), transparent 20%)",
    panels: [
      { l: "12%", t: "30%", w: "10%", h: "18%", bg: warm },
      { l: "30%", t: "26%", w: "12%", h: "22%", bg: "linear-gradient(180deg, rgba(232,120,58,0.28), rgba(20,14,10,0.2))" },
      { l: "50%", t: "34%", w: "9%", h: "16%", bg: warm },
      { l: "68%", t: "28%", w: "14%", h: "24%", bg: "#141210" },
      { l: "0%", t: "78%", w: "100%", h: "22%", bg: "#0c0c0c" },
    ],
  },
  static: {
    bg: "linear-gradient(180deg, #101114 0%, #080808 100%)",
    glow: "radial-gradient(circle at 50% 50%, rgba(200,206,210,0.08), transparent 30%)",
    panels: [
      { l: "16%", t: "22%", w: "68%", h: "4%", bg: "rgba(210,214,216,0.18)" },
      { l: "16%", t: "34%", w: "68%", h: "3%", bg: "rgba(210,214,216,0.1)" },
      { l: "16%", t: "46%", w: "48%", h: "4%", bg: "rgba(232,120,58,0.35)" },
      { l: "16%", t: "58%", w: "68%", h: "3%", bg: "rgba(210,214,216,0.12)" },
      { l: "16%", t: "70%", w: "36%", h: "3%", bg: "rgba(210,214,216,0.16)" },
    ],
  },
  screen: {
    bg: "linear-gradient(180deg, #0c0c0c 0%, #080808 100%)",
    glow: "radial-gradient(circle at 50% 46%, rgba(90,16,12,0.25), transparent 30%)",
    panels: [
      { l: "14%", t: "14%", w: "72%", h: "70%", bg: "#050505" },
      { l: "18%", t: "18%", w: "64%", h: "60%", bg: "linear-gradient(200deg, rgba(80,16,14,0.45), #070707 70%)" },
    ],
  },
  workshop: {
    bg: "linear-gradient(180deg, #12100e 0%, #080808 100%)",
    glow: "radial-gradient(circle at 40% 40%, rgba(232,120,58,0.12), transparent 22%)",
    panels: [
      { l: "22%", t: "22%", w: "34%", h: "36%", bg: "linear-gradient(180deg, #2c261e, #141210)" },
      { l: "8%", t: "64%", w: "84%", h: "8%", bg: "#1b1713" },
      { l: "64%", t: "30%", w: "12%", h: "28%", bg: "#241e18" },
    ],
  },
  mic: {
    bg: "linear-gradient(180deg, #140f0d 0%, #080808 100%)",
    glow: "radial-gradient(circle at 50% 36%, rgba(232,120,58,0.16), transparent 20%)",
    panels: [
      { l: "46%", t: "20%", w: "8%", h: "26%", bg: "#1c1c1c", radius: "999px" },
      { l: "49%", t: "44%", w: "2%", h: "22%", bg: "#2a2a2a" },
      { l: "0%", t: "74%", w: "100%", h: "4%", bg: "#2a1c14" },
    ],
  },
  file: {
    bg: "linear-gradient(180deg, #0e0e0e 0%, #080808 100%)",
    glow: "radial-gradient(circle at 48% 40%, rgba(232,220,200,0.12), transparent 24%)",
    panels: [
      { l: "32%", t: "14%", w: "34%", h: "70%", bg: "#d9d3c8" },
      { l: "37%", t: "24%", w: "24%", h: "1.5%", bg: "#b7b0a4" },
      { l: "37%", t: "30%", w: "18%", h: "1.5%", bg: "#b7b0a4" },
      { l: "37%", t: "36%", w: "22%", h: "1.5%", bg: "#b7b0a4" },
      { l: "37%", t: "42%", w: "14%", h: "1.5%", bg: "#b7b0a4" },
    ],
  },
  hospital: {
    bg: "linear-gradient(180deg, #0c1011 0%, #080808 100%)",
    glow: "radial-gradient(circle at 50% 46%, rgba(180,200,190,0.12), transparent 16%)",
    panels: [
      { l: "28%", t: "8%", w: "44%", h: "84%", bg: "#101618" },
      { l: "36%", t: "20%", w: "28%", h: "60%", bg: "#182022" },
      { l: "44%", t: "34%", w: "12%", h: "32%", bg: "rgba(190,210,200,0.2)" },
    ],
  },
  prep: {
    bg: "linear-gradient(180deg, #12100e 0%, #080808 100%)",
    glow: "radial-gradient(circle at 30% 60%, rgba(232,120,58,0.1), transparent 22%)",
    panels: [
      { l: "10%", t: "38%", w: "22%", h: "30%", bg: "#1a1612" },
      { l: "36%", t: "46%", w: "30%", h: "24%", bg: "#241e16" },
      { l: "70%", t: "34%", w: "16%", h: "34%", bg: "#14110e" },
    ],
  },
};

export function Stage({
  scene,
  className = "",
  drift = false,
  children,
}: {
  scene: SceneId;
  className?: string;
  drift?: boolean;
  children?: React.ReactNode;
}) {
  const spec = sceneArt[scene];

  return (
    <div className={`relative overflow-hidden bg-[#090909] ${className}`}>
      <div className={`absolute inset-0 ${drift ? "stage-drift" : ""}`} style={{ background: spec.bg }}>
        <div className="absolute inset-0" style={{ background: spec.glow }} />
        {spec.panels.map((panel, index) => (
          <span
            key={index}
            className="absolute block"
            style={{
              left: panel.l,
              top: panel.t,
              width: panel.w,
              height: panel.h,
              background: panel.bg,
              borderRadius: panel.radius,
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />
      {children}
    </div>
  );
}
