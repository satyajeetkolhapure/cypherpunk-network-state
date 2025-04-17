import { useState } from 'react';
import { useAccount } from '../contexts/AccountContext';
import { Button } from '../components/ui/button';
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { http } from 'viem';
import { parseEther } from 'viem';
import { toast } from 'sonner';
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { publicClient } from "../lib/passkey-auth";
import { privateKeyToAccount } from "viem/accounts";
import { createBundlerClient, createPaymasterClient } from 'viem/account-abstraction';
import { lineaSepolia as chain } from "viem/chains";
import { PageHeader } from '../components/page-header';

export default function UserOperation() {
    const { account } = useAccount();
    const [isLoading, setIsLoading] = useState(false);

    // More detailed logging
    console.log("=== UserOperation Component ===");
    console.log("Full account object:", account);
    console.log("Account details:", account?.details);
    console.log("Smart account:", account?.details?.smartAccount);

    const handleSendUserOp = async () => {
        // Check if we have a smart account connected
        if (!account?.details?.smartAccount) {
            console.log("Smart account missing", account); // Debug log
            toast.error("No smart account found. Please connect first.");
            return;
        }

        try {
            setIsLoading(true);

            // Create a delegator account from the private key stored in environment variables
            const delegatorAccount = privateKeyToAccount(import.meta.env.VITE_EVM_USER_PRIVATE_KEY as `0x${string}`);

            // Create a MetaMask smart account using the delegator account
            const smartAccount = await toMetaMaskSmartAccount({
                client: publicClient,
                implementation: Implementation.Hybrid,
                deployParams: [delegatorAccount.address, [], [], []],
                deploySalt: "0x",
                signatory: { account: delegatorAccount },
            });

            // Initialize paymaster client for handling gas payments
            const paymasterClient = createPaymasterClient({ 
                transport: http(import.meta.env.VITE_BUNDLER_URL) 
            });

            
            // Create bundler client that combines paymaster and chain configuration
            const bundlerClient = createBundlerClient({
                transport: http(import.meta.env.VITE_BUNDLER_URL),
                paymaster: paymasterClient,
                chain,
            });
            
            toast.info("Estimating gas price...");
            // Initialize Pimlico client for gas price estimation
            const pimlicoClient = createPimlicoClient({ 
                transport: http(import.meta.env.VITE_BUNDLER_URL) 
            });
            // Get gas price estimation from Pimlico (using 'fast' option for quicker processing)
            const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();
            
            toast.info("Sending user operation...");
            // Send the user operation with the estimated gas prices
            const userOperationHash = await bundlerClient.sendUserOperation({
                account: smartAccount,
                calls: [
                    {
                        to: "0x01f8e269cadcd36c945f012d2eeae814c42d1159",
                        value: parseEther("0.0001")
                    }
                ],
                ...fee // Spread the estimated gas prices into the operation
            });

            toast.info(`UserOp Hash: ${userOperationHash}`);

            // Wait for the user operation to be confirmed on chain
            const { receipt } = await bundlerClient.waitForUserOperationReceipt({
                hash: userOperationHash
            });

            toast.success("User operation confirmed!");
            console.log("Transaction receipt:", receipt);

        } catch (error) {
            console.error("Error sending user operation:", error);
            toast.error("Failed to send user operation: " + (error as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-full h-[100dvh] p-8 text-white">
            <div className="flex-1 overflow-y-auto">
                <PageHeader title="User Operation" />
                <div className="container mx-auto p-4">
                    <h1 className="text-2xl font-bold mb-4">Test User Operation</h1>
                    
                    
                    {!account?.details?.smartAccount ? (
                        <p className="text-red-500">
                            Please connect with a smart account first (Current account type: {account?.details?.isPasskey ? 'Passkey' : account?.details?.isEphemeral ? 'Ephemeral' : 'None'})
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-400">
                                Connected with smart account: {account.id}
                            </p>
                            <Button 
                                onClick={handleSendUserOp}
                                disabled={isLoading}
                            >
                                {isLoading ? "Sending..." : "Send Test UserOp"}
                            </Button>
                        </div>
                    )}
                    <br />
                    <pre className="bg-gray-800 p-4 rounded mb-4 overflow-auto">
                        {JSON.stringify(account, null, 2)} {/* Debug display */}
                    </pre>
                </div>
            </div>
        </div>
    );
} 