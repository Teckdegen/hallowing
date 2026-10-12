import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-24">
      <p className="text-[11px] font-semibold tracking-[0.18em] text-muted">HALLOWING</p>
      <h1 className="mt-3 text-2xl font-medium">That page is not here.</h1>
      <Link href="/" className="mt-6 inline-flex h-10 w-fit items-center rounded-full bg-accent px-4 text-sm font-medium text-[#1a0c08]">
        Back to live
      </Link>
    </main>
  );
}
