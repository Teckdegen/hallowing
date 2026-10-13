"use client";

import { useEffect, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/action-button";
import { useAuth } from "@/components/auth-provider";
import { channelName, savePost, searchProfiles, type Profile } from "@/lib/profiles";
import { CreateSkeleton } from "@/components/skeletons";

const steps = ["Details", "Video elements", "Checks", "Visibility"] as const;
type Step = (typeof steps)[number];

const visibilities = ["Private", "Unlisted", "Public"] as const;
type Visibility = (typeof visibilities)[number];

const commentChoices = ["Allow all comments", "Hold for review", "Disable comments"] as const;
type Comments = (typeof commentChoices)[number];

const visibilityCopy: Record<Visibility, string> = {
  Private: "Only you and people you choose can watch your video",
  Unlisted: "Anyone with the video link can watch your video",
  Public: "Everyone can watch your video",
};

const watchFor: Record<Visibility, string> = {
  Public: "Everyone",
  Unlisted: "Friends",
  Private: "Only you",
};

const commentsFor: Record<Comments, string> = {
  "Allow all comments": "Everyone",
  "Hold for review": "Friends",
  "Disable comments": "Off",
};

export function CreateView() {
  const { user, ready, configured, login } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<Step>("Details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [person, setPerson] = useState("");
  const [tagged, setTagged] = useState<string[]>([]);
  const [kids, setKids] = useState<boolean | null>(null);
  const [more, setMore] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("Public");
  const [comments, setComments] = useState<Comments>("Allow all comments");
  const [notice, setNotice] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [audienceError, setAudienceError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const [found, setFound] = useState<{ term: string; profiles: Profile[] }>({ term: "", profiles: [] });
  const personTerm = person.trim().replace(/^@/, "");
  const suggestions = personTerm && found.term === personTerm ? found.profiles : [];

  useEffect(() => {
    const term = personTerm;
    if (!term) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchProfiles(term, 4).then((next) => {
        if (!cancelled) setFound({ term, profiles: next.filter((profile) => profile.username !== user?.username) });
      });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [personTerm, user?.username]);

  function chooseFile(next: File | null) {
    if (!next) return;
    setFile(next);
    setTitle((current) => current || next.name.replace(/\.[^.]+$/, "").slice(0, 100));
    setStep("Details");
    setNotice(null);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0] ?? null);
  }

  function addHashtag() {
    const next = hashtag.trim().replace(/^#/, "").replace(/\s/g, "");
    if (!next || hashtags.includes(next)) {
      setHashtag("");
      return;
    }
    setHashtags((current) => [...current, next]);
    setHashtag("");
  }

  function addPerson(name: string) {
    const next = name.trim().replace(/^@/, "");
    if (!next || tagged.includes(next)) {
      setPerson("");
      return;
    }
    setTagged((current) => [...current, next]);
    setPerson("");
  }

  function goNext() {
    if (!user) {
      if (configured) login();
      return;
    }
    if (step === "Details") {
      const missingTitle = title.trim() ? null : "Add a title to your video.";
      const missingAudience = kids === null ? "Select if this video is made for kids." : null;
      setTitleError(missingTitle);
      setAudienceError(missingAudience);
      if (missingTitle || missingAudience) return;
      setStep("Video elements");
      return;
    }
    if (step === "Video elements") setStep("Checks");
    else if (step === "Checks") setStep("Visibility");
  }

  function goBack() {
    const index = steps.indexOf(step);
    const previous = steps[index - 1];
    if (previous) setStep(previous);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user?.wallet || !user.username || !file || pending) return;
    const missingTitle = title.trim() ? null : "Add a title to your video.";
    setTitleError(missingTitle);
    if (missingTitle) {
      setStep("Details");
      return;
    }
    const caption = [title.trim(), description.trim()].filter(Boolean).join("\n\n");
    setPending(true);
    setNotice(null);
    const { id, error } = await savePost({
      privyId: user.id,
      wallet: user.wallet,
      username: user.username,
      caption,
      hashtags,
      tagged,
      watch: watchFor[visibility],
      comments: commentsFor[comments],
      duet: "Everyone",
      stitch: "Everyone",
      video: file,
    });
    setPending(false);
    if (error) {
      setNotice(error);
      return;
    }
    router.push(id ? `/thanks?v=${id}` : "/thanks");
  }

  if (!ready) return <CreateSkeleton />;

  return (
    <main className="mx-auto w-full max-w-[980px] px-3 py-4 sm:px-4 sm:py-6">
      <form noValidate onSubmit={(event) => void onSubmit(event)} className="overflow-hidden rounded-lg border border-line bg-card shadow-xl">
        <header className="border-b border-line px-4 py-3 sm:px-6">
          <h1 className="text-base font-medium sm:text-lg">{file ? file.name : "Upload videos"}</h1>
          {file ? (
            <>
              <p className="mt-1 text-xs text-muted">{pending ? "Uploading" : "Upload complete. No issues found."}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-foreground/10">
                <div className={`h-full bg-accent ${pending ? "w-2/3" : "w-full"}`} />
              </div>
            </>
          ) : null}
        </header>

        {!file ? (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center ${dragging ? "bg-accent/10" : ""}`}
          >
            <UploadMark />
            <p className="mt-5 text-base">Drag and drop video files to upload</p>
            <p className="mt-2 max-w-sm text-sm text-muted">Your videos will be private until you publish them.</p>
            <label className="mt-6 cursor-pointer">
              <span className="inline-flex h-9 items-center rounded-sm bg-accent px-4 text-sm font-medium tracking-wide text-[#1a0c08]">
                SELECT FILES
              </span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="sr-only"
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              />
            </label>
            {!user ? (
              <p className="mt-4 text-sm text-muted">
                {configured ? "Log in to upload a video." : "Add NEXT_PUBLIC_PRIVY_APP_ID to .env.local, then restart the app."}
              </p>
            ) : !user.username || !user.wallet ? (
              <p className="mt-4 text-sm text-muted">Choose a username once your Solana wallet is ready.</p>
            ) : null}
          </div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="max-h-[calc(100dvh-16rem)] overflow-y-auto px-4 py-4 sm:px-6">
              {step === "Details" ? (
                <div className="flex flex-col gap-5">
                  <Field label="Title" count={`${title.length}/100`} error={titleError}>
                    <input
                      value={title}
                      onChange={(event) => {
                        setTitleError(null);
                        setTitle(event.target.value.slice(0, 100));
                      }}
                      aria-invalid={titleError ? true : undefined}
                      className={`h-10 ${inputClass(Boolean(titleError))}`}
                    />
                  </Field>
                  <Field label="Description" count={`${description.length}/5000`}>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value.slice(0, 5000))}
                      rows={5}
                      placeholder="Tell viewers about your video"
                      className={`${inputClass(false)} min-h-28 resize-y py-2`}
                    />
                  </Field>
                  <div>
                    <p className="text-sm font-medium">Thumbnail</p>
                    <p className="mt-1 text-xs text-muted">Select or upload a picture that shows what is in your video.</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="grid aspect-video place-items-center rounded border border-dashed border-line text-xs text-muted">Upload</div>
                      {preview ? <video src={preview} aria-label="Thumbnail from video" className="aspect-video w-full rounded object-cover" muted /> : null}
                    </div>
                  </div>
                  <fieldset>
                    <legend className="text-sm font-medium">Audience</legend>
                    <p className="mt-1 text-xs text-muted">This video is set to not made for kids, unless you say otherwise.</p>
                    <label className="mt-3 flex items-center gap-3 text-sm">
                      <input type="radio" name="kids" checked={kids === true} onChange={() => { setKids(true); setAudienceError(null); }} className="m-0 size-4 shrink-0" />
                      Yes, it is made for kids
                    </label>
                    <label className="mt-2 flex items-center gap-3 text-sm">
                      <input type="radio" name="kids" checked={kids === false} onChange={() => { setKids(false); setAudienceError(null); }} className="m-0 size-4 shrink-0" />
                      No, it is not made for kids
                    </label>
                    {audienceError ? <p role="alert" className="mt-2 text-sm text-accent">{audienceError}</p> : null}
                  </fieldset>
                  <button type="button" onClick={() => setMore((value) => !value)} className="w-fit text-sm font-medium text-accent">
                    {more ? "Show less" : "Show more"}
                  </button>
                  {more ? (
                    <div className="flex flex-col gap-5">
                      <div>
                        <p className="text-sm font-medium">Tags</p>
                        <div className="mt-2 flex gap-2">
                          <input
                            value={hashtag}
                            onChange={(event) => setHashtag(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === ",") {
                                event.preventDefault();
                                addHashtag();
                              }
                            }}
                            placeholder="Add a tag"
                            className={`h-10 ${inputClass(false)}`}
                          />
                          <button type="button" onClick={addHashtag} className="h-10 shrink-0 rounded-sm bg-foreground/5 px-3 text-sm">
                            Add
                          </button>
                        </div>
                        <ChipList items={hashtags} onRemove={(label) => setHashtags((current) => current.filter((item) => item !== label))} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Credits</p>
                        <input
                          value={person}
                          onChange={(event) => setPerson(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addPerson(person);
                            }
                          }}
                          placeholder="@username"
                          className={`mt-2 h-10 ${inputClass(false)}`}
                        />
                        {suggestions.length > 0 ? (
                          <ul className="mt-2 overflow-hidden rounded border border-line">
                            {suggestions.map((profile) => (
                              <li key={profile.username}>
                                <button type="button" onClick={() => addPerson(profile.username)} className="block w-full px-3 py-2 text-left text-sm hover:bg-foreground/5">
                                  {channelName(profile)}
                                  <span className="ml-2 text-muted">@{profile.username}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <ChipList items={tagged.map((item) => `@${item}`)} onRemove={(label) => setTagged((current) => current.filter((item) => `@${item}` !== label))} />
                      </div>
                      <label className="block text-sm">
                        <span className="font-medium">Comments</span>
                        <select
                          value={comments}
                          onChange={(event) => setComments(event.target.value as Comments)}
                          className={`mt-2 h-10 ${inputClass(false)}`}
                        >
                          {commentChoices.map((choice) => (
                            <option key={choice}>{choice}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === "Video elements" ? (
                <div>
                  <h2 className="text-base font-medium">Add video elements</h2>
                  <p className="mt-2 text-sm text-muted">Cards and an end screen can point viewers to another video. You can add those after this video is posted.</p>
                </div>
              ) : null}

              {step === "Checks" ? (
                <div>
                  <h2 className="text-base font-medium">Checks</h2>
                  <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
                    <li className="flex items-center justify-between py-3">
                      Copyright
                      <span className="text-muted">No issues found</span>
                    </li>
                    <li className="flex items-center justify-between py-3">
                      Ad suitability
                      <span className="text-muted">No issues found</span>
                    </li>
                  </ul>
                </div>
              ) : null}

              {step === "Visibility" ? (
                <fieldset>
                  <legend className="text-base font-medium">Visibility</legend>
                  <p className="mt-1 text-sm text-muted">Choose when to publish and who can watch your video.</p>
                  <div className="mt-4 flex flex-col gap-3">
                    {visibilities.map((option) => (
                      <label key={option} className={`flex cursor-pointer items-center gap-3 rounded border px-3 py-3 ${option === visibility ? "border-accent" : "border-line"}`}>
                        <input type="radio" name="visibility" checked={option === visibility} onChange={() => setVisibility(option)} className="m-0 size-4 shrink-0" />
                        <span>
                          <span className="block text-sm font-medium">{option}</span>
                          <span className="mt-0.5 block text-xs text-muted">{visibilityCopy[option]}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
            </div>

            <aside className="border-t border-line p-4 lg:border-t-0 lg:border-l">
              <div className="overflow-hidden rounded bg-black">
                <video src={preview ?? undefined} aria-label="Video preview" className="aspect-video w-full" controls playsInline />
              </div>
              <p className="mt-3 text-xs text-muted">Video link</p>
              <p className="truncate text-sm">{file.name}</p>
            </aside>
          </div>
        )}

        {file ? (
          <footer className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <ol className="flex flex-wrap gap-x-4 gap-y-2 text-xs sm:text-sm">
              {steps.map((item, index) => {
                const current = steps.indexOf(step);
                const done = index < current;
                return (
                  <li key={item} className={item === step ? "font-medium text-foreground" : "text-muted"}>
                    <span className={`mr-1 inline-grid size-5 place-items-center rounded-full text-[11px] ${done || item === step ? "bg-accent text-[#1a0c08]" : "bg-foreground/10"}`}>
                      {done ? "✓" : index + 1}
                    </span>
                    {item}
                  </li>
                );
              })}
            </ol>
            <div className="flex items-center justify-end gap-2">
              {notice ? <p role="alert" className="text-sm text-accent">{notice}</p> : null}
              {step !== "Details" ? (
                <button type="button" onClick={goBack} className="h-9 rounded-sm px-4 text-sm font-medium hover:bg-foreground/5">
                  BACK
                </button>
              ) : null}
              {step === "Visibility" ? (
                <ActionButton
                  type="submit"
                  pending={pending}
                  idle="Publish"
                  busy="Publishing"
                  disabled={!user?.username}
                  className="h-9 rounded-sm bg-accent px-4 text-sm font-medium text-[#1a0c08]"
                />
              ) : (
                <button type="button" onClick={goNext} className="h-9 rounded-sm bg-accent px-4 text-sm font-medium tracking-wide text-[#1a0c08]">
                  NEXT
                </button>
              )}
            </div>
          </footer>
        ) : null}
      </form>
    </main>
  );
}

function inputClass(invalid: boolean) {
  return `w-full rounded-sm border bg-transparent px-3 text-sm outline-none ${invalid ? "border-accent" : "border-line focus:border-foreground"}`;
}

function Field({
  label,
  count,
  error,
  children,
}: {
  label: string;
  count?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm font-medium">
        {label}
        {count ? <span className="text-xs font-normal text-faint">{count}</span> : null}
      </span>
      <div className="mt-2">{children}</div>
      {error ? <p role="alert" className="mt-2 text-sm text-accent">{error}</p> : null}
    </label>
  );
}

function ChipList({ items, onRemove }: { items: string[]; onRemove: (item: string) => void }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item}>
          <button type="button" onClick={() => onRemove(item)} className="rounded-full bg-foreground/5 px-3 py-1 text-sm">
            {item}
          </button>
        </li>
      ))}
    </ul>
  );
}

function UploadMark() {
  return (
    <svg width="112" height="80" viewBox="0 0 112 80" aria-hidden className="text-muted">
      <path d="M56 8v36" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M42 22 56 8l14 14" stroke="currentColor" strokeWidth="3" fill="none" />
      <path d="M20 40h14a22 22 0 0 1 44 0h14a16 16 0 0 1 0 32H20a16 16 0 0 1 0-32z" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
