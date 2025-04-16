import { createPublicClient, http } from "viem";
import { lineaSepolia as chain } from "viem/chains";
import { createBundlerClient } from "viem/account-abstraction";
import { 
  createWebAuthnCredential, 
  toWebAuthnAccount,
} from 'viem/account-abstraction';
import {
  Implementation,
  toMetaMaskSmartAccount,
} from "@metamask/delegation-toolkit";
import { toHex } from "viem";

// Initialize public client
export const publicClient = createPublicClient({
  chain,
  transport: http(),
});

// Initialize bundler client
export const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http("https://bundler.linea.build"), // Using Linea's bundler
});

export async function createPasskeyAccount() {
  try {
    // Check if we're in a secure context
    if (!window.isSecureContext) {
      throw new Error("WebAuthn requires a secure context (HTTPS). Please access this site over HTTPS.");
    }

    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      throw new Error("WebAuthn is not supported in this browser.");
    }

    // Check if the platform authenticator is available
    if (!(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())) {
      throw new Error("Platform authenticator (passkey) is not available on this device.");
    }

    // 1. Register a credential (passkey)
    const credential = await createWebAuthnCredential({
      name: 'CNS Passkey',
      // Add more specific options for better compatibility
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        requireResidentKey: true,
      },
      attestation: "none",
    });
    
    console.log("2");
    // 2. Create a WebAuthn owner account from the credential
    const webAuthnAccount = toWebAuthnAccount({
      credential,
    });

    // 3. Create a key ID for the signatory
    const keyId = toHex("my-key-id");

    // 4. Create a MetaMask smart account with the WebAuthn signatory
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Hybrid,
      deployParams: ["0x", [], [], []], // Empty address since we're using WebAuthn
      deploySalt: "0x",
      signatory: { webAuthnAccount, keyId },
    });
    console.log("5");
    
    return {
      credential,
      webAuthnAccount,
      smartAccount,
      keyId,
    };
  } catch (error) {
    console.error("Error creating passkey account:", error);
    if (error instanceof Error) {
      if (error.message.includes("not allowed by the user agent")) {
        throw new Error("Please enable passkey support in your browser settings and ensure you're using a supported browser.");
      } else if (error.message.includes("user denied permission")) {
        throw new Error("Passkey creation was cancelled or denied by the user.");
      } else if (error.message.includes("The operation either timed out or was not allowed")) {
        throw new Error("Passkey creation timed out. Please try again.");
      }
    }
    throw error;
  }
} 