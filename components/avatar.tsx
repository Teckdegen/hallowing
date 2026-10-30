"use client";

export function Avatar({
  src,
  alt = "",
  className = "size-8",
}: {
  src: string | null;
  alt?: string;
  className?: string;
}) {
  return (
    <span className={`grid shrink-0 overflow-hidden rounded-full bg-foreground/10 ${className}`}>
      <img
        src={src || "/ghost-pixel.png"}
        alt={alt}
        width={256}
        height={256}
        className={`h-full w-full object-cover ${src ? "" : "[image-rendering:pixelated]"}`}
      />
    </span>
  );
}
