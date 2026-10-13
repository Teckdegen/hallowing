import type { Metadata } from "next";
import { CreateView } from "@/components/create-view";

export const metadata: Metadata = {
  title: "Upload videos",
  description: "Drag in a video, add a title and description, then choose who can watch it.",
};

export default function CreatePage() {
  return <CreateView />;
}
