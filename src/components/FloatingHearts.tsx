import { useEffect, useState } from "react";
import Particles from "@tsparticles/react";
import { tsParticles } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

export function FloatingHearts() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    loadSlim(tsParticles).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      <Particles
        id="tsparticles-hearts"
        options={{
          fullScreen: { enable: false },
          fpsLimit: 60,
          particles: {
            number: { value: 20 },
            color: { value: ["#f43f5e", "#fb7185", "#fda4af"] },
            shape: {
              type: "character",
              options: {
                character: {
                  value: ["❤", "💖", "💕", "✨"],
                  font: "sans-serif",
                  fill: true,
                },
              },
            },
            opacity: { value: { min: 0.2, max: 0.6 } },
            size: { value: { min: 14, max: 28 } },
            move: {
              enable: true,
              speed: { min: 0.6, max: 1.8 },
              direction: "top",
              straight: false,
              outModes: { default: "out" },
            },
          },
          detectRetina: true,
        }}
        className="w-full h-full"
      />
    </div>
  );
}
