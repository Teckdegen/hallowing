import type { Metadata } from "next";
import { CreateView } from "@/components/create-view";

export const metadata: Metadata = {
  title: "Upload a haunt",
  description: "Drag in a haunt of 1:30 or shorter, add a title, then choose who can watch it.",
};

export default function CreatePage() {
  return <CreateView />;
}
