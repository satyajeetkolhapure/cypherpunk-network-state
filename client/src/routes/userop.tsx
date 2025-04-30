import { useState, useEffect } from 'react';
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
import { sepolia as chain } from "viem/chains";
import { PageHeader } from '../components/page-header';


export default function UserOperation() {
    const { account } = useAccount();
    const [isLoading, setIsLoading] = useState(false);
    const [smartAccount, setSmartAccount] = useState<any>(null);

    useEffect(() => {
        const initializeSmartAccount = async () => {
            console.log("Initializing smart account...");
            // Create a delegator account from the private key stored in environment variables
            const delegatorAccount = privateKeyToAccount(import.meta.env.VITE_EVM_USER_PRIVATE_KEY as `0x${string}`);

            // Create a MetaMask smart account using the delegator account
            const newSmartAccount = await toMetaMaskSmartAccount({
                client: publicClient,
                implementation: Implementation.Hybrid,
                deployParams: [delegatorAccount.address, [], [], []],
                deploySalt: "0x",
                signatory: { account: delegatorAccount },
            });

            console.log("New smart account address:", newSmartAccount.address);
            setSmartAccount(newSmartAccount);
        };

        initializeSmartAccount();
    }, []); // Empty dependency array means this effect runs once on mount

    // Add effect to track smartAccount state changes
    useEffect(() => {
        console.log("Smart account state updated:", smartAccount?.address);
    }, [smartAccount]);

    const handleSendUserOp = async () => {
        // Check if we have a smart account connected
        if (!smartAccount) {
            console.log("Smart account missing", smartAccount); // Debug log
            toast.error("No smart account found. Please connect first.");
            return;
        }

        try {
            setIsLoading(true);
            console.log("Current smart account in handleSendUserOp:", smartAccount.address);

            // Initialize paymaster client for handling gas payments
            const paymasterClient = createPaymasterClient({ 
                transport: http(import.meta.env.VITE_BUNDLER_URL) 
            });

            console.log("Smart account address is:", smartAccount.address);

            console.log("Smart account is deployed: ", await smartAccount.isDeployed());
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
            
            console.log("Fee:", fee);
            toast.info("Sending user operation...");
            // Send the user operation with the estimated gas prices
            const userOperationHash = await bundlerClient.sendUserOperation({
                account: smartAccount,
                calls: [
                    {
                        to: "0x01f8e269cadcd36c945f012d2eeae814c42d1159",
                        value: parseEther("0")
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
                    
                    
                    {!smartAccount ? (
                        <p className="text-red-500">
                            Please connect with a smart account first (Current account type: {account?.details?.isPasskey ? 'Passkey' : account?.details?.isEphemeral ? 'Ephemeral' : 'None'})
                        </p>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-gray-400">
                                Connected with smart account: {smartAccount?.address}
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
                        {JSON.stringify(smartAccount, null, 2)} {/* Debug display */}
                    </pre>
                </div>
            </div>
        </div>
    );
} 