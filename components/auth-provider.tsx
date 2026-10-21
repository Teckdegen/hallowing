"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PrivyProvider, useCreateWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { toSolanaWalletConnectors, useWallets as useSolanaWallets } from "@privy-io/react-auth/solana";
import { getAddress, isAddress } from "viem";
import { activeChain, robinhood, robinhoodTestnet } from "@/lib/chain";
import { channelName, fetchProfile, publicMediaUrl, saveEvmWallet, saveProfile, type PortraitGender, type Profile } from "@/lib/profiles";
import { useTheme } from "@/components/theme";

export type SessionUser = {
  id: string;
  wallet: string | null;
  evmWallet: string | null;
  username: string | null;
  gender: PortraitGender | null;
};

type AuthContextValue = {
  user: SessionUser | null;
  ready: boolean;
  configured: boolean;
  displayName: string;
  avatarUrl: string | null;
  login: () => void;
  signOut: () => Promise<void>;
  needsUsername: boolean;
  saveUsername: (username: string) => Promise<string | null>;
  applyProfile: (profile: Profile) => void;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 4)}…${wallet.slice(-4)}`;
}

function signedOut(configured: boolean, ready = true): AuthContextValue {
  return {
    user: null,
    ready,
    configured,
    displayName: "you",
    avatarUrl: null,
    login: () => undefined,
    signOut: async () => undefined,
    needsUsername: false,
    saveUsername: async () => "Add NEXT_PUBLIC_PRIVY_APP_ID to .env.local.",
    applyProfile: () => undefined,
    getToken: async () => null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const [connectors, setConnectors] = useState<ReturnType<typeof toSolanaWalletConnectors> | null>(null);

  useEffect(() => {
    setConnectors(toSolanaWalletConnectors({ shouldAutoConnect: false }));
  }, []);

  if (!appId) {
    return <AuthContext.Provider value={signedOut(false)}>{children}</AuthContext.Provider>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme,
          accentColor: "#e8783a",
          walletChainType: "ethereum-and-solana",
        },
        defaultChain: activeChain(),
        supportedChains: [robinhoodTestnet, robinhood],
        ...(connectors
          ? {
              externalWallets: {
                solana: { connectors },
              },
            }
          : {}),
        embeddedWallets: {
          solana: { createOnLogin: "users-without-wallets" },
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <PrivySession>{children}</PrivySession>
    </PrivyProvider>
  );
}

function PrivySession({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const { wallets, ready: walletsReady } = useSolanaWallets();
  const { wallets: evmWallets, ready: evmReady } = useWallets();
  const { createWallet } = useCreateWallet();
  const creatingEvm = useRef(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  const wallet = wallets[0]?.address ?? null;
  const evmWallet = evmWallets[0]?.address && isAddress(evmWallets[0].address) ? getAddress(evmWallets[0].address) : null;

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) {
      setProfile(null);
      setProfileReady(true);
      return;
    }
    if (!walletsReady) return;

    let active = true;
    fetchProfile(user.id).then((next) => {
      if (!active) return;
      setProfile(next);
      setProfileReady(true);
    });
    return () => {
      active = false;
    };
  }, [authenticated, ready, user, walletsReady, wallet]);

  useEffect(() => {
    if (!ready || !authenticated || user?.wallet?.address || creatingEvm.current) return;
    creatingEvm.current = true;
    createWallet().catch(() => undefined);
  }, [authenticated, createWallet, ready, user?.wallet?.address]);

  useEffect(() => {
    if (!profile || !evmWallet || profile.evm_wallet === evmWallet) return;
    let active = true;
    saveEvmWallet(profile.privy_id, evmWallet).then((saved) => {
      if (!active || saved.error) return;
      setProfile((current) => (current ? { ...current, evm_wallet: evmWallet } : current));
    });
    return () => {
      active = false;
    };
  }, [evmWallet, profile]);

  const value = useMemo<AuthContextValue>(() => {
    const session =
      authenticated && user
        ? { id: user.id, wallet, evmWallet, username: profile?.username ?? null, gender: profile?.gender ?? null }
        : null;
    return {
      user: session,
      ready: ready && (!authenticated || (walletsReady && evmReady && profileReady)),
      configured: true,
      displayName: profile ? channelName(profile) : wallet ? shortWallet(wallet) : "you",
      avatarUrl: publicMediaUrl("images", profile?.avatar_path ?? null),
      login,
      signOut: async () => {
        setProfile(null);
        await logout();
      },
      needsUsername: Boolean(authenticated && walletsReady && profileReady && wallet && !profile?.username),
      saveUsername: async (name: string) => {
        if (!user || !wallet) return "Your Solana wallet is still being created.";
        const saved = await saveProfile({ privyId: user.id, wallet, username: name });
        if (saved.error || !saved.profile) return saved.error ?? "Could not save that username.";
        setProfile(saved.profile);
        return null;
      },
      applyProfile: setProfile,
      getToken: getAccessToken,
    };
  }, [authenticated, evmReady, evmWallet, getAccessToken, login, logout, profile, profileReady, ready, user, wallet, walletsReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
