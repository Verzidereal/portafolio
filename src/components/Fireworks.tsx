import { useEffect, useRef } from "react";

export default function FireworksBG() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let fw: any;
    let mounted = true;

    (async () => {
      const { Fireworks } = await import("fireworks-js"); // solo en el cliente
      if (!mounted || !ref.current) return;

      const options = {
        autoresize: true,
        opacity: 0.5,
        acceleration: 1.05,
        friction: 0.97,
        gravity: 1.5,
        particles: 55,
        traceLength: 3,
        traceSpeed: 10,
        explosion: 6,
        brightness: { min: 50, max: 80, decay: { min: 0.015, max: 0.03 } },
        sound: { enable: false },
      };

      fw = new Fireworks(ref.current, options);
      fw.start();
    })();

    return () => {
      mounted = false;
      if (fw) fw.stop();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
