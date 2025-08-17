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
        flex items-center justify-center gap-2 px-8 py-5 rounded-lg cursor-pointer 
        font-medium text-lg min-w-64 h-14 transition-all duration-200
        ${
          isLight
            ? "bg-white text-black border-2 border-gray-200 hover:bg-gray-50"
            : "bg-black text-white border-2 border-gray-700 hover:bg-gray-900"
        }
        ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <div
        className={`
        w-4 h-4 rounded-sm flex-shrink-0
        ${isLight ? "bg-base-blue" : "bg-white"}
      `}
      />
      <span>{isLoading ? "Signing in..." : "Sign in with Base"}</span>
    </button>
  );
};
