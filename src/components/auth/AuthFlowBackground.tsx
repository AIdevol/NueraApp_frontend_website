"use client";

/**
 * Full-viewport ambient background for login / register:
 * black base + orange/amber bloom (matches brand).
 */
const RIBBON = "/ai-flow-ribbon.png";

export function AuthFlowBackground() {
  return (
    <div
      className="auth-flow-bg fixed inset-0 z-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 85% 15%, rgba(255, 122, 26, 0.14) 0%, transparent 45%),
            radial-gradient(ellipse 90% 70% at 10% 90%, rgba(251, 146, 60, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 70% 60% at 65% 55%, rgba(234, 88, 12, 0.08) 0%, transparent 55%),
            linear-gradient(165deg, #020202 0%, #060606 28%, #0a0a0a 52%, #050505 78%, #020202 100%)
          `,
        }}
      />

      <div
        className="absolute rounded-full auth-flow-orb-a"
        style={{
          width: "min(55vw, 480px)",
          height: "min(55vw, 480px)",
          left: "5%",
          top: "15%",
          background: "radial-gradient(circle, rgba(255, 122, 26, 0.22) 0%, rgba(251, 146, 60, 0.08) 45%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />
      <div
        className="absolute rounded-full auth-flow-orb-b"
        style={{
          width: "min(65vw, 560px)",
          height: "min(65vw, 560px)",
          right: "-8%",
          bottom: "5%",
          background: "radial-gradient(circle, rgba(251, 146, 60, 0.16) 0%, rgba(234, 88, 12, 0.06) 50%, transparent 72%)",
          filter: "blur(56px)",
        }}
      />
      <div
        className="absolute rounded-full auth-flow-orb-c"
        style={{
          width: "min(45vw, 380px)",
          height: "min(45vw, 380px)",
          left: "40%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(255, 122, 26, 0.12) 0%, rgba(251, 191, 36, 0.05) 40%, transparent 65%)",
          filter: "blur(64px)",
        }}
      />

      <div
        className="absolute auth-flow-ribbon-bloom"
        style={{
          inset: "-20%",
          backgroundImage: `url('${RIBBON}')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "min(125vw, 145vh)",
          backgroundPosition: "58% 48%",
          opacity: 0.38,
          filter: "blur(54px) saturate(1.35) hue-rotate(-15deg) brightness(0.95)",
          WebkitMaskImage:
            "radial-gradient(ellipse 96% 92% at 56% 47%, black 10%, rgba(0,0,0,0.62) 56%, rgba(0,0,0,0.18) 78%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 96% 92% at 56% 47%, black 10%, rgba(0,0,0,0.62) 56%, rgba(0,0,0,0.18) 78%, transparent 100%)",
        }}
      />

      <div
        className="absolute auth-flow-ribbon-main"
        style={{
          inset: "-12%",
          backgroundImage: `url('${RIBBON}')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "min(118vw, 138vh)",
          backgroundPosition: "56% 46%",
          opacity: 0.48,
          filter: "blur(0.6px) saturate(1.25) hue-rotate(-12deg) brightness(1.02)",
          WebkitMaskImage:
            "radial-gradient(ellipse 98% 92% at 54% 46%, black 16%, rgba(0,0,0,0.84) 60%, rgba(0,0,0,0.28) 82%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 98% 92% at 54% 46%, black 16%, rgba(0,0,0,0.84) 60%, rgba(0,0,0,0.28) 82%, transparent 100%)",
        }}
      />

      <div
        className="absolute auth-flow-ribbon-glow mix-blend-screen"
        style={{
          inset: "-15%",
          backgroundImage: `url('${RIBBON}')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "min(115vw, 132vh)",
          backgroundPosition: "52% 52%",
          opacity: 0.12,
          filter: "blur(5px) brightness(1.15) hue-rotate(-10deg)",
          WebkitMaskImage:
            "radial-gradient(ellipse 92% 86% at 52% 48%, black 20%, rgba(0,0,0,0.55) 62%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 92% 86% at 52% 48%, black 20%, rgba(0,0,0,0.55) 62%, transparent 100%)",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          WebkitBackdropFilter: "blur(10px)",
          backdropFilter: "blur(10px)",
          WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 58%)",
          maskImage: "linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 58%)",
          opacity: 0.45,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 85% 70% at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.55) 100%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.35) 0%, transparent 18%, transparent 82%, rgba(0, 0, 0, 0.45) 100%)
          `,
        }}
      />

      <style>{`
        .auth-flow-bg .auth-flow-orb-a {
          animation: authFlowOrbA 28s ease-in-out infinite;
        }
        .auth-flow-bg .auth-flow-orb-b {
          animation: authFlowOrbB 34s ease-in-out infinite;
        }
        .auth-flow-bg .auth-flow-orb-c {
          animation: authFlowOrbC 22s ease-in-out infinite;
        }
        .auth-flow-bg .auth-flow-ribbon-bloom {
          animation: authFlowRibbonBloom 40s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
        }
        .auth-flow-bg .auth-flow-ribbon-main {
          animation: authFlowRibbonMain 32s cubic-bezier(0.42, 0, 0.58, 1) infinite;
        }
        .auth-flow-bg .auth-flow-ribbon-glow {
          animation: authFlowRibbonGlow 48s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite reverse;
        }
        @keyframes authFlowOrbA {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
          50% { transform: translate(8%, 6%) scale(1.08); opacity: 0.85; }
        }
        @keyframes authFlowOrbB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-6%, -8%) scale(1.06); }
          70% { transform: translate(4%, 3%) scale(0.96); }
        }
        @keyframes authFlowOrbC {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.88; }
          50% { transform: translate(calc(-50% + 1.5vw), calc(-50% - 2vh)) scale(1.1); opacity: 1; }
        }
        @keyframes authFlowRibbonMain {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
          }
          20% {
            transform: translate3d(1.2%, -1.8%, 0) scale(1.025) rotate(0.35deg);
          }
          45% {
            transform: translate3d(-1%, 1.2%, 0) scale(1.04) rotate(-0.25deg);
          }
          70% {
            transform: translate3d(0.8%, 0.6%, 0) scale(1.018) rotate(0.15deg);
          }
        }
        @keyframes authFlowRibbonBloom {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1.02) rotate(0deg);
          }
          33% {
            transform: translate3d(-2%, 1.5%, 0) scale(1.06) rotate(-0.4deg);
          }
          66% {
            transform: translate3d(1.5%, -1%, 0) scale(1.03) rotate(0.3deg);
          }
        }
        @keyframes authFlowRibbonGlow {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1.01);
          }
          50% {
            transform: translate3d(-1.2%, 1.4%, 0) scale(1.045);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-flow-bg .auth-flow-orb-a,
          .auth-flow-bg .auth-flow-orb-b,
          .auth-flow-bg .auth-flow-orb-c,
          .auth-flow-bg .auth-flow-ribbon-bloom,
          .auth-flow-bg .auth-flow-ribbon-main,
          .auth-flow-bg .auth-flow-ribbon-glow {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
