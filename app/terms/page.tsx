import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "The rules for watching, chatting, and uploading on Hallowing.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms and conditions">
      <p>Hallowing lets you watch videos, comment, send gifts, and upload videos after you sign in with Privy.</p>
      <p>You keep responsibility for what you upload and type. Do not post anything you do not have the right to share.</p>
      <p>
        Usernames are unique and limited to 3–20 letters, numbers, or underscores. Your wallet address is stored with that username and shown with your posts.
      </p>
      <p>
        Who can watch, comment, duet, and stitch is saved with each post. Those settings describe your choice. They do not by themselves block another person who already has the file.
      </p>
      <p>The site can change, go offline, or remove a post that breaks these terms. Watching is provided as available, including sample playback while your own uploads are being stored.</p>
      <p>These terms apply to the Hallowing app you are using. Privacy details are on the privacy policy page.</p>
    </LegalPage>
  );
}
