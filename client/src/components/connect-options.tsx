import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { useConnect } from "wagmi";
import { mmConnector } from "../lib/wagmi";
import { Key, Github, Twitter, Wallet } from "lucide-react";
import { createPasskeyAccount } from "../lib/passkey-auth";
import { useState } from "react";
import { toast } from "sonner";

export function ConnectOptions() {
    const { connect } = useConnect();
    const [isLoading, setIsLoading] = useState(false);

    const handlePasskeyAuth = async () => {

        try {
            setIsLoading(true);
            const { smartAccount } = await createPasskeyAccount();
            console.log("Passkey account created:", smartAccount);
            toast.success("Passkey created successfully!");
            // TODO: Store the account information in your app's state management
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

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="secondary"
                    className="bg-yellow-500 text-black"
                >
                    Connect
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle className="text-gray-500 uppercase tracking-wider text-2xl font-semibold">
                        Connect to CNS
                    </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
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
                        Connect with your Wallet
                    </Button>
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