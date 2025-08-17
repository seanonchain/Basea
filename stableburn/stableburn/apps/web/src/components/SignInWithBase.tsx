"use client";

import React, { useState } from "react";
import { createBaseAccountSDK } from "@base-org/account";

interface SignInWithBaseProps {
  onSignIn: (address: string) => void;
  colorScheme?: "light" | "dark";
}

export const SignInWithBaseButton = ({
  onSignIn,
  colorScheme = "light",
}: SignInWithBaseProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const isLight = colorScheme === "light";

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      // Initialize the SDK (no config needed for defaults)
      const provider = createBaseAccountSDK({
        appName: "Agent Spend Permissions",
      }).getProvider();

      // 1 — get a fresh nonce (generate locally)
      const nonce = window.crypto.randomUUID().replace(/-/g, "");

      // 2 — connect and authenticate
      const response = await provider.request({
        method: "wallet_connect",
        params: [
          {
            version: "1",
            capabilities: {
              signInWithEthereum: {
                chainId: 8453,
                nonce,
              },
            },
          },
        ],
      }) as { accounts: { address: string }[] };

      console.log("accounts", response.accounts);
      const { address } = response.accounts[0];

      console.log("✅ Successfully connected with Base Account!");
      console.log("Address:", address);

      // No signature verification needed here
      onSignIn(address);
    } catch (err) {
      console.error("Sign in failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={isLoading}
      className={`
        relative overflow-hidden group
        flex items-center justify-center gap-3 px-8 py-4 rounded-xl cursor-pointer 
        font-semibold text-lg min-w-64 transition-all duration-300
        bg-gradient-to-r from-base-blue to-blue-600 text-white
        hover:shadow-lg hover:shadow-base-blue/25 hover:scale-105
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-flame-500 before:to-flame-400
        before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
      `}
    >
      <span className="relative z-10 flex items-center gap-3">
        <div className="w-5 h-5 rounded bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-sm" />
        </div>
        <span>{isLoading ? "Signing in..." : "Sign in with Base"}</span>
      </span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
};
