import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createDelegation, toMetaMaskSmartAccount, Implementation } from "@metamask/delegation-toolkit";
import { useAccount as useAccountContext } from "@/contexts/AccountContext";
import { SmartAccount } from "viem/account-abstraction";
import { PageHeader } from "@/components/page-header";
import { publicClient } from "@/lib/passkey-auth";
import { privateKeyToAccount } from "viem/accounts";

// Type for the stored delegation
export interface StoredDelegation {
    delegation: any;
    signature: string;
    agentAddress: string;
    scope: string;
    duration: string;
    timestamp: number;
}

export default function Delegate() {
    const { address: wagmiAddress } = useAccount();
    const { account } = useAccountContext();
    const { toast } = useToast();
    const [agentAddress, setAgentAddress] = useState<`0x${string}`>("0x01F8e269CADCD36C945F012d2EeAe814c42D1159");
    const [scope, setScope] = useState("");
    const [duration, setDuration] = useState("");

    const handleDelegate = async () => {
        // Check if either wagmi address or account context is available
        if (!wagmiAddress && !account?.id) {
            toast({
                title: "Error",
                description: "Please connect your wallet first",
                variant: "destructive",
            });
            return;
        }

        if (!agentAddress) {
            toast({
                title: "Error",
                description: "Please fill in all fields",
                variant: "destructive",
            });
            return;
        }

        try {
            if (!account?.details?.smartAccount) {
                toast({
                    title: "Error",
                    description: "No smart account found. Please connect with a smart account first.",
                    variant: "destructive",
                });
                return;
            }

            // Create the delegation
            const delegation = createDelegation({
                to: agentAddress,
                from: account.details.smartAccount.address,
                caveats: [], // Empty caveats array for now
            });

            const privateKey = import.meta.env.VITE_EVM_USER_PRIVATE_KEY as `0x${string}`;
            if (!privateKey) {
                throw new Error("VITE_EVM_USER_PRIVATE_KEY environment variable is not set");
            }
            // TODO retrieve the delegatorAccount from the user conencted account
            const delegatorAccount = privateKeyToAccount(privateKey);

            // Create a new MetaMask smart account instance for signing
            const smartAccount = await toMetaMaskSmartAccount({
                client: publicClient,
                implementation: Implementation.Hybrid,
                deployParams: [delegatorAccount.address, [], [], []],
                deploySalt: "0x",
                signatory: { account: delegatorAccount }
            });

            // Sign the delegation using the MetaMask smart account
            const signature = await smartAccount.signDelegation({ delegation });

            // Create the signed delegation object
            const signedDelegation: StoredDelegation = {
                delegation,
                signature,
                agentAddress,
                scope,
                duration,
                timestamp: Date.now()
            };

            // Store the delegation in localStorage
            const delegations = JSON.parse(localStorage.getItem('delegations') || '[]');
            delegations.push(signedDelegation);
            localStorage.setItem('delegations', JSON.stringify(delegations));

            console.log("Signed delegation:", signedDelegation);

            toast({
                title: "Success",
                description: "Authority delegated successfully",
            });
        } catch (error) {
            console.error("Delegation error:", error);
            toast({
                title: "Error",
                description: "Failed to delegate authority",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="flex flex-col w-full h-[100dvh] p-8 text-white">
            <div className="flex-1 overflow-y-auto">
                <PageHeader title="Delegate" />
                <div className="container mx-auto py-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Delegate Authority to AI Agent</CardTitle>
                            <CardDescription>
                                Grant specific permissions to an AI Agent to act on your behalf
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="agent-address">AI Agent Address</Label>
                                <Input
                                    id="agent-address"
                                    placeholder="Enter AI Agent's address"
                                    value={agentAddress}
                                    onChange={(e) => setAgentAddress(e.target.value as `0x${string}`)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scope">Delegation Scope</Label>
                                <Textarea
                                    id="scope"
                                    placeholder="Describe what actions the AI Agent can perform on your behalf"
                                    value={scope}
                                    onChange={(e) => setScope(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Delegation Duration (in days)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    placeholder="Enter duration in days"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleDelegate} className="w-full">
                                Delegate Authority
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Helper function to get stored delegations
export function getStoredDelegations(): StoredDelegation[] {
    try {
        return JSON.parse(localStorage.getItem('delegations') || '[]');
    } catch (error) {
        console.error('Error reading delegations from storage:', error);
        return [];
    }
}

// Helper function to get the most recent delegation
export function getLatestDelegation(): StoredDelegation | null {
    const delegations = getStoredDelegations();
    if (delegations.length === 0) return null;
    
    // Sort by timestamp in descending order
    delegations.sort((a, b) => b.timestamp - a.timestamp);
    return delegations[0];
} 