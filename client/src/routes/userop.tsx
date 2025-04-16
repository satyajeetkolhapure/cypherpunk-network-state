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

export default function UserOperation() {
    const { account } = useAccount();
    const [isLoading, setIsLoading] = useState(false);

    // More detailed logging
    console.log("=== UserOperation Component ===");
    console.log("Full account object:", account);
    console.log("Account details:", account?.details);
    console.log("Smart account:", account?.details?.smartAccount);

    const handleSendUserOp = async () => {
        if (!account?.details?.smartAccount) {
            console.log("Smart account missing", account); // Debug log
            toast.error("No smart account found. Please connect first.");
            return;
        }

        try {
            setIsLoading(true);

            // Reconstruct the smart account
            const delegatorAccount = privateKeyToAccount(import.meta.env.VITE_EVM_PRIVATE_KEY as `0x${string}`);
            const smartAccount = await toMetaMaskSmartAccount({
                client: publicClient,
                implementation: Implementation.Hybrid,
                deployParams: [delegatorAccount.address, [], [], []],
                deploySalt: "0x",
                signatory: { account: delegatorAccount },
            });

            const pimlicoClient = createPimlicoClient({
                transport: http(`https://api.pimlico.io/v1/linea-sepolia/rpc?apikey=${import.meta.env.VITE_PIMLICO_API_KEY}`),
            });

            const { fast: fee } = await pimlicoClient.getUserOperationGasPrice();

            toast.info("Sending user operation...");
            
            const userOperationHash = await pimlicoClient.sendUserOperation({
                account: smartAccount, // Use the reconstructed smart account
                calls: [
                    {
                        to: "0x01f8e269cadcd36c945f012d2eeae814c42d1159",
                        value: parseEther("0.0001")
                    }
                ],
                ...fee
            });

            toast.info(`UserOp Hash: ${userOperationHash}`);

            const { receipt } = await pimlicoClient.waitForUserOperationReceipt({
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
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Test User Operation</h1>
            
            <pre className="bg-gray-800 p-4 rounded mb-4 overflow-auto">
                {JSON.stringify(account, null, 2)} {/* Debug display */}
            </pre>
            
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
        </div>
    );
} 