import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/contexts/AccountContext";
import { DelegationFramework, SINGLE_DEFAULT_MODE } from "@metamask/delegation-toolkit";
import { lineaSepolia as chain } from "viem/chains";
import { zeroAddress } from "viem";
import { toast } from "sonner";
import { http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, createPublicClient } from 'viem';
import { getDelegatorEnvironment } from "../lib/delegator-environment";

// Create delegate wallet client
const delegateAccount = privateKeyToAccount(import.meta.env.VITE_EVM_PRIVATE_KEY as `0x${string}`);
const delegateWalletClient = createWalletClient({
  account: delegateAccount,
  chain,
  transport: http(),
});

// Create public client for reading blockchain data
const publicClient = createPublicClient({
  chain,
  transport: http(),
});

export default function Redeem() {
    const { account } = useAccount();
    const [isLoading, setIsLoading] = useState(false);

    const handleRedeemDelegation = async () => {
        console.log("Starting redeem delegation process...");
        try {
            setIsLoading(true);
            console.log("Account details:", account);
            
            // TODO: Get stored delegations from localStorage or context
            const storedDelegations = JSON.parse(localStorage.getItem('delegations') || '[]');
            console.log("Stored delegations:", storedDelegations);
            
            if (storedDelegations.length === 0) {
                console.log("No delegations found in localStorage");
                toast.error("No delegations found to redeem");
                return;
            }

            const delegations = storedDelegations.map((d: any) => d.delegation);
            const mode = SINGLE_DEFAULT_MODE;
            console.log("Processed delegations:", delegations);
            
            // For now, using a simple execution. You can modify this based on your needs
            const executions = [{
                target: zeroAddress as `0x${string}`,
                value: 0n,
                callData: "0x" as `0x${string}`
            }];
            console.log("Prepared executions:", executions);

            const redeemDelegationCalldata = DelegationFramework.encode.redeemDelegations({
                delegations: [delegations],
                modes: [mode],
                executions: [executions]
            });
            console.log("Generated redeem delegation calldata:", redeemDelegationCalldata);

            if (!account?.details?.smartAccount) {
                console.log("No smart account found in account details");
                toast.error("No smart account found");
                return;
            }

            // Send the transaction using the delegate wallet client
            console.log("Sending transaction with delegate wallet...");
            const transactionHash = await delegateWalletClient.sendTransaction({
                to: getDelegatorEnvironment(chain.id).DelegationManager,
                data: redeemDelegationCalldata,
                chain,
            });

            console.log("Transaction sent! Hash:", transactionHash);
            toast.info(`Transaction Hash: ${transactionHash}`);

            // Wait for the transaction to be confirmed using the public client
            const receipt = await publicClient.waitForTransactionReceipt({
                hash: transactionHash
            });

            console.log("Transaction successful! Receipt:", receipt);
            toast.success("Delegation redeemed successfully!");
        } catch (error) {
            console.error("Error redeeming delegation:", error);
            toast.error("Failed to redeem delegation: " + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-full h-[100dvh] p-8 text-white">
            <div className="flex-1 overflow-y-auto">
                <PageHeader title="Redeem Delegation" />
                <div className="mt-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-gray-800 rounded-lg p-6">
                            <h2 className="text-xl font-bold mb-4">Redeem Your Delegation</h2>
                            <p className="text-gray-400 mb-6">
                                Redeem your stored delegations to execute actions on behalf of the delegator.
                            </p>
                            <Button
                                onClick={handleRedeemDelegation}
                                disabled={isLoading || !account?.details?.smartAccount}
                                className="w-full"
                            >
                                {isLoading ? "Redeeming..." : "Redeem Delegation"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 