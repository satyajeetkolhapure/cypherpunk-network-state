import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { useConnect, useAccount as useWagmiAccount, useDisconnect } from "wagmi";
import { mmConnector } from "../lib/wagmi";
import { Key, Github, Twitter, Wallet, TestTube2 } from "lucide-react";
import { createPasskeyAccount } from "../lib/passkey-auth";
import { useState } from "react";
import { toast } from "sonner";
import { privateKeyToAccount } from "viem/accounts";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { publicClient } from "../lib/passkey-auth";
import { useAccount as useAccountContext } from "../contexts/AccountContext";
import { Address } from "./cns/address";
import { useNavigate, Link } from "react-router-dom";

export function ConnectOptions() {
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const { address, isConnected } = useWagmiAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingEphemeral, setIsCreatingEphemeral] = useState(false);
    const { account, setAccount } = useAccountContext();
    const navigate = useNavigate();

    const handleSuccessfulConnection = (account: any) => {
        setAccount(account);
        toast.success("Successfully connected!");
        navigate("/census");
    };

    const handlePasskeyAuth = async () => {
        try {
            setIsLoading(true);
            const { smartAccount } = await createPasskeyAccount();
            console.log("Passkey account created:", smartAccount);
            
            // Create account object
            const account = {
                id: smartAccount.address,
                name: `Passkey Account ${smartAccount.address.slice(0, 8)}`,
                username: `passkey_${smartAccount.address.slice(0, 8)}`,
                details: {
                    isPasskey: true,
                    createdAt: new Date().toISOString(),
                    smartAccount: smartAccount
                }
            };
            
            handleSuccessfulConnection(account);
        } catch (error) {
            console.error("Error during passkey authentication:", error);
            if (error instanceof Error) {
                if (error.message.includes("not allowed by the user agent")) {
                    toast.error("Please enable passkey support in your browser settings");
                } else if (error.message.includes("user denied permission")) {
                    toast.error("Passkey creation was cancelled");
                } else {
                    toast.error("Failed to create passkey: " + error.message);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = () => {
        toast.info("Social login coming soon!");
    };

    const handleCreateEphemeralAccount = async () => {
        try {
            setIsCreatingEphemeral(true);
            
            const privateKey = import.meta.env.VITE_EVM_PRIVATE_KEY as `0x${string}`;
            if (!privateKey) {
                throw new Error("EVM_PRIVATE_KEY environment variable is not set");
            }
            
            // Create account from private key
            const delegatorAccount = privateKeyToAccount(privateKey);
            
            // Create MetaMask smart account
            const delegatorSmartAccount = await toMetaMaskSmartAccount({
                client: publicClient,
                implementation: Implementation.Hybrid,
                deployParams: [delegatorAccount.address, [], [], []],
                deploySalt: "0x",
                signatory: { account: delegatorAccount },
            });

            // Create account object
            const account = {
                id: delegatorAccount.address,
                name: `Test Account ${delegatorAccount.address.slice(0, 8)}`,
                username: `test_${delegatorAccount.address.slice(0, 8)}`,
                details: {
                    isEphemeral: true,
                    createdAt: new Date().toISOString(),
                    privateKey: privateKey, // Note: In production, you should never store private keys in localStorage
                    smartAccount: delegatorSmartAccount
                }
            };
            
            handleSuccessfulConnection(account);
            // Store in localStorage for this session
            localStorage.setItem('ephemeralAccount', JSON.stringify(account));
        } catch (error) {
            console.error("Error creating ephemeral account:", error);
            if (error instanceof Error) {
                if (error.message.includes("EVM_PRIVATE_KEY")) {
                    toast.error("Please set the EVM_PRIVATE_KEY environment variable");
                } else {
                    toast.error("Failed to create ephemeral account: " + error.message);
                }
            } else {
                toast.error("Failed to create ephemeral account");
            }
        } finally {
            setIsCreatingEphemeral(false);
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                {isConnected && address ? (
                    <Link to={`/netizens/${address}`}>
                        <Button
                            variant="secondary"
                            className="bg-yellow-500 text-black"
                        >
                            <Address address={address} showFullAddress={false} />
                        </Button>
                    </Link>
                ) : account ? (
                    <Link to={`/netizens/${account.id}`}>
                        <Button
                            variant="secondary"
                            className="bg-yellow-500 text-black"
                        >
                            <Address address={account.id} showFullAddress={false} />
                        </Button>
                    </Link>
                ) : (
                    <Button
                        variant="secondary"
                        className="bg-yellow-500 text-black"
                    >
                        Connect
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle className="text-gray-500 uppercase tracking-wider text-2xl font-semibold">
                        {isConnected || account ? "Account" : "Connect to CNS"}
                    </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                    {isConnected || account ? (
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 text-red-500"
                            onClick={() => {
                                disconnect?.();
                                setAccount(null);
                                localStorage.removeItem('ephemeralAccount');
                            }}
                        >
                            Disconnect
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={handlePasskeyAuth}
                                disabled={isLoading}
                            >
                                <Key className="h-4 w-4" />
                                {isLoading ? "Creating Passkey..." : "Sign in with Your Device"}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={handleSocialLogin}
                            >
                                <Twitter className="h-4 w-4" />
                                Continue with Twitter
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={() => connect({ connector: mmConnector })}
                            >
                                <Wallet className="h-4 w-4" />
                                {isConnected ? "Connected" : "Connect with your Wallet"}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={handleCreateEphemeralAccount}
                                disabled={isCreatingEphemeral}
                            >
                                <TestTube2 className="h-4 w-4" />
                                {isCreatingEphemeral ? "Creating Test Account..." : "Create Test Account"}
                            </Button>
                        </>
                    )}
                </div>
                <div className="mt-8 text-center">
                    <pre className="text-gray-400 font-mono text-[10px]">
                        {`
    ███████╗██╗   ██╗██████╗ ██╗  ██╗███████╗██████╗ 
    ██╔════╝╚██╗ ██╔╝██╔══██╗██║  ██║██╔════╝██╔══██╗
    ██║      ╚████╔╝ ██████╔╝███████║█████╗  ██████╔╝
    ██║       ╚██╔╝  ██╔═══╝ ██╔══██║██╔══╝  ██╔══██╗
    ██╔════╗   ██║   ██║     ██║  ██║███████╗██║  ██║
    ╚██████╗   ╚═╝   ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
                        `}
                    </pre>
                    <p className="text-gray-500 text-[10px] mt-2 text-right">Make the State Cypherpunk</p>
                </div>
            </SheetContent>
        </Sheet>
    );
} 