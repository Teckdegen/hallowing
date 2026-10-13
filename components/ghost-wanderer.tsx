"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };
type Phase = "moving" | "resting" | "haunting";

const headerSpace = 72;
const margin = 16;
const speed = 55;
const videoChance = 0.45;
const wanderFor = 35000;

export function GhostWanderer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ghost: HTMLDivElement = node;

    const bounds = () => {
      const size = ghost.offsetWidth || 60;
      return {
        size,
        minX: margin,
        maxX: Math.max(margin, window.innerWidth - size - margin),
        minY: headerSpace,
        maxY: Math.max(headerSpace, window.innerHeight - size - margin),
      };
    };

    const random = (min: number, max: number) => min + Math.random() * (max - min);
    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    function visibleVideos() {
      const rects: DOMRect[] = [];
      for (const video of Array.from(document.querySelectorAll("video, mux-player, [data-ghost-haunt]"))) {
        const rect = video.getBoundingClientRect();
        const width = Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0);
        const height = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, headerSpace);
        if (width > 140 && height > 100) rects.push(rect);
      }
      return rects;
    }

    function openPoint(): Point {
      const box = bounds();
      return { x: random(box.minX, box.maxX), y: random(box.minY, box.maxY) };
    }

    function pickTarget(allowVideo: boolean): { point: Point; video: boolean } {
      const box = bounds();
      const videos = allowVideo ? visibleVideos() : [];
      if (videos.length > 0 && Math.random() < videoChance) {
        const rect = videos[Math.floor(Math.random() * videos.length)];
        const left = Math.max(rect.left, 0);
        const right = Math.min(rect.right, window.innerWidth);
        const top = Math.max(rect.top, headerSpace);
        const bottom = Math.min(rect.bottom, window.innerHeight);
        return {
          point: {
            x: clamp(random(left + (right - left) * 0.2, right - (right - left) * 0.2) - box.size / 2, box.minX, box.maxX),
            y: clamp(random(top + (bottom - top) * 0.2, bottom - (bottom - top) * 0.25) - box.size / 2, box.minY, box.maxY),
          },
          video: true,
        };
      }
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const point = openPoint();
        if (!overVideo(point, videos.length ? videos : visibleVideos())) return { point, video: false };
      }
      return { point: openPoint(), video: false };
    }

    function overVideo(point: Point, rects = visibleVideos()) {
      const size = ghost.offsetWidth || 60;
      const cx = point.x + size / 2;
      const cy = point.y + size / 2;
      return rects.some((rect) => cx > rect.left && cx < rect.right && cy > rect.top && cy < rect.bottom);
    }

    let clock = 0;
    let last = performance.now();
    let frame = 0;
    let lastCheck = -1000;
    let done = false;
    let haunting = false;
    let phase: Phase = "moving";
    let phaseEnds = 0;
    let targetIsVideo = false;
    let position: Point = { x: window.innerWidth + 40, y: random(headerSpace + 40, Math.max(headerSpace + 41, window.innerHeight * 0.45)) };
    let from = position;
    let to = position;
    let bend: Point = position;
    let moveStarts = 0;
    let moveTime = 1;
    let tilt = 0;
    let homing = false;
    let homeScale = 1;
    let scale = 1;

    function goHome() {
      const logo = document.querySelector("[data-ghost-home]");
      if (!logo) {
        finish();
        return;
      }
      const rect = logo.getBoundingClientRect();
      const size = ghost.offsetWidth || 60;
      homing = true;
      homeScale = rect.width / size;
      ghost.style.zIndex = "45";
      setHaunting(false);
      moveTo({ point: { x: rect.left + rect.width / 2 - size / 2, y: rect.top + rect.height / 2 - size / 2 }, video: false });
    }

    function finish() {
      delete ghost.dataset.ready;
      done = true;
    }

    function setFacing(dx: number) {
      if (Math.abs(dx) < 24) return;
      ghost.dataset.facing = dx > 0 ? "right" : "left";
    }

    function moveTo(target: { point: Point; video: boolean }) {
      from = position;
      to = target.point;
      targetIsVideo = target.video;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy);
      const arc = clamp(distance * 0.25, 20, 110) * (Math.random() < 0.5 ? -1 : 1);
      const nx = distance ? -dy / distance : 0;
      const ny = distance ? dx / distance : 0;
      bend = { x: (from.x + to.x) / 2 + nx * arc, y: (from.y + to.y) / 2 + ny * arc };
      moveStarts = clock;
      moveTime = clamp((distance / speed) * 1000, 3500, 14000);
      phase = "moving";
      setFacing(dx);
    }

    function setHaunting(next: boolean) {
      if (next === haunting) return;
      haunting = next;
      if (next) ghost.dataset.haunting = "";
      else delete ghost.dataset.haunting;
    }

    function tick(now: number) {
      clock += Math.min(now - last, 50);
      last = now;

      if (phase === "moving") {
        const raw = Math.min(1, (clock - moveStarts) / moveTime);
        const t = 0.5 - Math.cos(Math.PI * raw) / 2;
        const u = 1 - t;
        const next = {
          x: u * u * from.x + 2 * u * t * bend.x + t * t * to.x,
          y: u * u * from.y + 2 * u * t * bend.y + t * t * to.y,
        };
        tilt = tilt * 0.9 + clamp((next.x - position.x) * 2.2, -7, 7) * 0.1;
        position = next;
        if (homing) {
          scale = 1 + (homeScale - 1) * t;
          if (raw > 0.6) ghost.dataset.facing = "left";
        }
        if (raw >= 1) {
          if (homing) finish();
          phase = targetIsVideo ? "haunting" : "resting";
          phaseEnds = clock + (targetIsVideo ? random(5000, 8000) : random(2000, 4500));
        }
      } else if (!done) {
        tilt *= 0.95;
        if (clock >= phaseEnds) {
          if (clock >= wanderFor) goHome();
          else moveTo(pickTarget(phase !== "haunting"));
        }
      }

      if (!homing && clock - lastCheck > 280) {
        lastCheck = clock;
        setHaunting(overVideo(position));
      }

      const calm = homing ? 1 - scale : 0;
      const bob = Math.sin(clock / 520) * 6 * (1 - Math.min(1, calm * 2));
      const sway = Math.sin(clock / 1300) * 3 * (homing ? 0.3 : 1);
      ghost.style.transform = `translate3d(${position.x}px, ${position.y + bob}px, 0) rotate(${(tilt + sway) * (homing ? 0.5 : 1)}deg) scale(${scale})`;
      if (!done) frame = requestAnimationFrame(tick);
    }

    function onResize() {
      if (homing) return;
      const box = bounds();
      position = { x: clamp(position.x, box.minX, box.maxX), y: clamp(position.y, box.minY, box.maxY) };
      if (phase === "moving") moveTo({ point: { x: clamp(to.x, box.minX, box.maxX), y: clamp(to.y, box.minY, box.maxY) }, video: targetIsVideo });
    }

    ghost.dataset.facing = "left";
    moveTo(pickTarget(false));
    ghost.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    ghost.dataset.ready = "";
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={ref} className="ghost-wander" aria-hidden>
      <img src="/ghost.png" alt="" width={256} height={256} className="ghost-wander-face h-auto w-full" />
    </div>
  );
}
