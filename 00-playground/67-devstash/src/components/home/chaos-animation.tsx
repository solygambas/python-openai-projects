"use client";

import { useEffect, useRef, useState } from "react";
import {
  StickyNote,
  Github,
  MessageSquare,
  Monitor,
  FolderOpen,
  Terminal,
  ClipboardList,
  Link2,
} from "lucide-react";

const icons = [
  { icon: StickyNote, color: "#f59e0b" },
  { icon: Github, color: "#8b5cf6" },
  { icon: MessageSquare, color: "#22c55e" },
  { icon: Monitor, color: "#3b82f6" },
  { icon: FolderOpen, color: "#64748b" },
  { icon: Terminal, color: "#06b6d4" },
  { icon: ClipboardList, color: "#ec4899" },
  { icon: Link2, color: "#6366f1" },
];

// Static positions for initial render and reduced motion
const staticPositions = [
  { x: 20, y: 20 },
  { x: 100, y: 30 },
  { x: 180, y: 20 },
  { x: 30, y: 100 },
  { x: 120, y: 110 },
  { x: 200, y: 100 },
  { x: 50, y: 180 },
  { x: 150, y: 190 },
];

interface IconState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  scaleDir: number;
}

export function ChaosAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [iconStates, setIconStates] = useState<IconState[]>(() =>
    staticPositions.map((pos, index) => ({
      x: pos.x,
      y: pos.y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      rotation: Math.random() * 20 - 10,
      rotationSpeed: (Math.random() - 0.5) * 2,
      scale: 1,
      scaleDir: index % 2 === 0 ? 1 : -1,
    })),
  );
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || reducedMotion) return;

    const container = containerRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      const containerRect = container.getBoundingClientRect();
      const width = containerRect.width;
      const height = containerRect.height;
      const iconSize = 40;

      setIconStates((prevStates) =>
        prevStates.map((icon) => {
          // Apply velocity
          let newX = icon.x + icon.vx;
          let newY = icon.y + icon.vy;
          let newVx = icon.vx;
          let newVy = icon.vy;

          // Bounce off walls
          if (newX <= 0 || newX >= width - iconSize) {
            newVx *= -1;
            newX = Math.max(0, Math.min(width - iconSize, newX));
          }
          if (newY <= 0 || newY >= height - iconSize) {
            newVy *= -1;
            newY = Math.max(0, Math.min(height - iconSize, newY));
          }

          // Mouse repulsion
          const dx = newX + iconSize / 2 - mouseRef.current.x;
          const dy = newY + iconSize / 2 - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 80) {
            const force = (80 - distance) / 80;
            const angle = Math.atan2(dy, dx);
            newVx += Math.cos(angle) * force * 0.5;
            newVy += Math.sin(angle) * force * 0.5;
          }

          // Damping
          newVx *= 0.99;
          newVy *= 0.99;

          // Subtle scale pulsing
          let newScale = icon.scale + icon.scaleDir * 0.002;
          let newScaleDir = icon.scaleDir;
          if (newScale > 1.1) newScaleDir = -1;
          if (newScale < 0.9) newScaleDir = 1;

          return {
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            rotation: icon.rotation + icon.rotationSpeed,
            rotationSpeed: icon.rotationSpeed,
            scale: newScale,
            scaleDir: newScaleDir,
          };
        }),
      );

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [mounted, reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="relative h-[280px] w-[280px] overflow-hidden rounded-xl border-2 border-dashed border-border bg-card md:h-[320px] md:w-[320px]"
    >
      {icons.map((item, index) => {
        const Icon = item.icon;
        const state = iconStates[index];
        const pos = staticPositions[index];

        if (reducedMotion) {
          return (
            <div
              key={index}
              className="absolute"
              style={{
                transform: `translate(${pos?.x ?? 0}px, ${pos?.y ?? 0}px)`,
              }}
            >
              <Icon className="size-8" style={{ color: item.color }} />
            </div>
          );
        }

        return (
          <div
            key={index}
            className="absolute"
            style={{
              transform: `translate(${state?.x ?? pos?.x ?? 0}px, ${state?.y ?? pos?.y ?? 0}px) rotate(${state?.rotation ?? 0}deg) scale(${state?.scale ?? 1})`,
            }}
          >
            <Icon className="size-8" style={{ color: item.color }} />
          </div>
        );
      })}
    </div>
  );
}
