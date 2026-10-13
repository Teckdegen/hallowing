import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Hallowing stores: your Privy id, Solana wallet, Robinhood Chain address, channel profile, posts, and on-device theme and cookie choices.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>Hallowing is a horror and prank video site. This page says what the app stores and who else receives it.</p>
      <p>
        If you sign in, Privy handles authentication and can create a Solana wallet and a Robinhood Chain wallet. Hallowing then stores your Privy id, both wallet addresses, username, display name, bio, website, social usernames, profile photo, and banner in Supabase so your channel can be tied to you.
      </p>
      <p>
        When you upload, the video file, caption, hashtags, tagged names, and who can watch, comment, duet, or stitch are saved in Supabase. Video files go in a public storage bucket. A like or a comment on a video is saved with your username.
      </p>
      <p>
        On this device, Hallowing stores your light or dark theme and whether you accepted or declined the cookie banner. Those values stay in local storage and are not sent to a server.
      </p>
      <p>Playback uses Mux. Chat messages you type stay in the browser until you leave the page.</p>
      <p>You can stop using the account by signing out. To remove a stored username or upload, use the same Supabase project that holds the profiles and posts tables.</p>
    </LegalPage>
  );
}
