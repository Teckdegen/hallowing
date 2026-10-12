"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { chatSeed, type ChatLine } from "@/lib/data";
import { formatNumber } from "@/lib/format";

const tones = {
  orange: "bg-accent/20 text-accent",
  green: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-sky-500/15 text-sky-300",
  muted: "bg-white/10 text-white/70",
};

const faces = ["#3b82f6", "#a855f7", "#22c55e", "#f97316", "#e11d48", "#14b8a6", "#eab308"];

function faceColor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0) * 13) % faces.length;
  return faces[hash];
}

export function ChatPanel({
  live,
  viewers,
  label,
  fill = false,
}: {
  live: boolean;
  viewers: number;
  label?: string;
  fill?: boolean;
}) {
  const [messages, setMessages] = useState<ChatLine[]>(chatSeed);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setMessages((current) => [...current, { user: "teck", text: value, ago: "now" }]);
    setText("");
  }

  return (
    <section className={`flex min-h-0 flex-col bg-background ${fill ? "h-full" : "h-[min(70vh,560px)] lg:h-full"}`}>
      <div className="flex h-10 shrink-0 items-center justify-between px-3">
        <h2 className="text-sm font-semibold">{label ?? (live ? "Live chat" : "Chat")}</h2>
        <span className="text-[11px] text-faint">{live ? `${formatNumber(viewers)} watching` : "Replay"}</span>
      </div>
      <div className="chat-scroll min-h-0 flex-1 overflow-y-auto">
        {messages.map((message, index) => (
          <ChatRow key={`${message.user}-${index}`} message={message} />
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSubmit} className="shrink-0 px-3 py-2">
        <label htmlFor={inputId} className="sr-only">
          Say something
        </label>
        <input
          id={inputId}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Say something..."
          className="h-10 w-full rounded-full bg-[#161616] px-4 text-sm outline-none placeholder:text-faint"
        />
      </form>
    </section>
  );
}

function ChatRow({ message }: { message: ChatLine }) {
  return (
    <article className="flex gap-2.5 px-3 py-2.5">
      <span
        className="grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
        style={{ background: faceColor(message.user) }}
        aria-hidden
      >
        {message.user.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold">{message.user}</span>
          {message.badge ? (
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tones[message.tone ?? "muted"]}`}>
              {message.badge}
            </span>
          ) : null}
          <span className="ml-auto shrink-0 text-[11px] text-faint">{message.ago}</span>
        </div>
        {message.text ? <p className="mt-0.5 text-sm leading-5 text-white/90">{message.text}</p> : null}
        {message.card ? (
          <div className="mt-2 flex items-center gap-2.5 rounded-lg bg-[#161616] px-2.5 py-2">
            <span className="grid size-8 place-items-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300">
              {message.card.title.slice(0, 1)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{message.card.title}</span>
              <span className="block text-xs text-muted">{message.card.meta}</span>
            </span>
            <span className="ml-auto text-right text-emerald-400">
              <span className="block text-sm font-semibold tabular-nums">{message.card.change}</span>
              <span className="block text-[11px]">{message.card.detail}</span>
            </span>
          </div>
        ) : null}
        {typeof message.likes === "number" ? (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-faint">
            <HeartIcon />
            {message.likes}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function HeartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M6 10.2 1.8 6.2A2.4 2.4 0 0 1 6 3.1a2.4 2.4 0 0 1 4.2 3.1L6 10.2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
      />
    </svg>
  );
}
