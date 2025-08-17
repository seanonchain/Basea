"use client";

import React, { useState } from "react";
import { requestSpendPermission } from "@base-org/account/spend-permission";
import { createBaseAccountSDK } from "@base-org/account";

interface SpendPermissionSetupProps {
  userAddress: string;
  onPermissionGranted: () => void;
}

export function SpendPermissionSetup({
  userAddress,
  onPermissionGranted,
}: SpendPermissionSetupProps) {
  const [dailyLimit, setDailyLimit] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");


  const handleSetupPermission = async () => {
    setIsLoading(true);
    setError("");

    try {
      // First create server wallet to get the spender address
      const walletResponse = await fetch("/api/wallet/create", {
        method: "POST",
      });

      if (!walletResponse.ok) {
        throw new Error("Failed to create server wallet");
      }

      const walletData = await walletResponse.json();
      const spenderAddress = walletData.smartAccountAddress;

      if (!spenderAddress) {
        throw new Error("Smart account address not found");
      }

      console.log("Smart account address (spender):", spenderAddress);
      console.log("Server wallet address:", walletData.serverWalletAddress);

      // USDC address on Base mainnet
      const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

      // Convert USD to USDC (6 decimals)
      const allowanceUSDC = BigInt(dailyLimit * 1_000_000);

      // Request spend permission from user's wallet (this requires user signature)
      console.log("Requesting spend permission from user...");
      const permission = await requestSpendPermission({
        account: userAddress as `0x${string}`,
        spender: spenderAddress as `0x${string}`,
        token: USDC_BASE_ADDRESS as `0x${string}`,
        chainId: 8453, // Base mainnet
        allowance: allowanceUSDC,
        periodInDays: 1, // Daily limit
        provider: createBaseAccountSDK({
          appName: "Agent Spend Permissions",
        }).getProvider(),
      });

      console.log("Spend permission granted:", permission);

      // Store the permission for later use
      localStorage.setItem("spendPermission", JSON.stringify(permission));
      
      onPermissionGranted();
    } catch (error) {
      console.error("Permission setup error:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="max-w-md mx-auto bento-card p-8">
      <div className="bento-card-gradient" />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-base-blue to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
            🔐
          </div>
          <h3 className="text-xl font-bold text-steel-900">
            Set Up Spending Permissions
          </h3>
        </div>

        <p className="text-steel-600 mb-6">
          Grant the AI agent permission to purchase creator coins on your behalf using your USDC.
        </p>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="dailyLimit"
              className="block text-sm font-semibold text-steel-700 mb-3"
            >
              Daily Spending Limit (USD)
            </label>
            <div className="p-4 bg-steel-50 rounded-xl">
              <div className="text-center mb-4">
                <span className="text-3xl font-bold text-gradient">${dailyLimit}</span>
                <span className="text-steel-600 text-sm ml-2">per day</span>
              </div>
              <input
                type="range"
                id="dailyLimit"
                min="1"
                max="2"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full h-3 bg-steel-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #0052FF 0%, #0052FF ${(dailyLimit - 1) * 100}%, #E4E4E7 ${(dailyLimit - 1) * 100}%, #E4E4E7 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-steel-500 mt-2">
                <span>$1</span>
                <span>$2</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={handleSetupPermission}
            disabled={isLoading}
            className="w-full relative overflow-hidden group flex justify-center py-4 px-6 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-base-blue to-blue-600 hover:shadow-lg hover:shadow-base-blue/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">
              {isLoading
                ? "Setting up..."
                : `Grant $${dailyLimit}/day Spending Permission`}
            </span>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-flame-500 to-flame-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
        </div>

        <div className="mt-6 p-4 bg-steel-50 rounded-xl">
          <div className="flex items-start gap-2">
            <span className="text-flame-500">🔥</span>
            <p className="text-xs text-steel-600">
              This creates a secure spending permission that allows the agent to
              spend up to ${dailyLimit} per day from your wallet to buy creator coins.
              Gas fees are sponsored automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
