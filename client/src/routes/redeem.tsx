import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/contexts/AccountContext";
import { DelegationFramework, getDeleGatorEnvironment, Implementation, SINGLE_DEFAULT_MODE, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { sepolia as chain } from "viem/chains";
import { zeroAddress } from "viem";
import { toast } from "sonner";
import { http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient } from 'viem';
import { bundlerClient, publicClient } from "@/lib/passkey-auth";
import { createBundlerClient } from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";

// Create delegate wallet client
const delegateAccount = privateKeyToAccount(import.meta.env.VITE_EVM_PRIVATE_KEY as `0x${string}`);

const delegateSmartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [delegateAccount.address, [], [], []],
    deploySalt: "0x",
    signatory: { account: delegateAccount },
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

            // Initialize Pimlico client for gas price estimation
            const pimlicoClient = createPimlicoClient({ 
                transport: http(import.meta.env.VITE_BUNDLER_URL) 
            });
            // Get gas price estimation from Pimlico (using 'fast' option for quicker processing)
            const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();
            
            console.log("Fee:", fee);
            toast.info("Sending user operation...");

            // Send the user operation using the bundler client
            console.log("Sending user operation with smart account...");
            const userOperationHash = await bundlerClient.sendUserOperation({
                account: delegateSmartAccount,
                calls: [
                  {
                    to: delegateSmartAccount.address,
                    data: redeemDelegationCalldata
                  }
                ],
                ...fee
              });

              toast.info(`UserOp Hash: ${userOperationHash}`);

              // Wait for the user operation to be confirmed on chain
              const { receipt } = await bundlerClient.waitForUserOperationReceipt({
                  hash: userOperationHash
              });
  
              toast.success("User operation confirmed!");
              console.log("Transaction receipt:", receipt);
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