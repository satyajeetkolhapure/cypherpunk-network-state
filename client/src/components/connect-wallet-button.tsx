import { useAccount, useDisconnect } from "wagmi";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { checkIsNetizen } from "../lib/cns/get-cns-netizens";
import { Badge } from "./ui/badge";
import { Address } from "./cns/address";
import { Link } from "react-router";
import { ConnectOptions } from "./connect-options";

export function ConnectWalletButton() {
    const { disconnect } = useDisconnect();
    const { address, isConnected } = useAccount();
    const [isNetizen, setIsNetizen] = useState(false);
    useEffect(() => {
        if (isConnected && address) {
            checkIsNetizen(address).then((bool) => {
                setIsNetizen(bool);
            });
        }
    }, [address]);

    if (isConnected) {
        return (
            <div className="flex flex-row items-center gap-2">
                {isNetizen && (
                    <Badge className="uppercase bg-yellow-500">netizen</Badge>
                )}
                {!isNetizen && (
                    <Button
                        className="uppercase bg-yellow-500"
                        onClick={() =>
                            (window.location.href = "/naturalization")
                        }
                    >
                        become a CNS netizen
                    </Button>
                )}
                <div className="text-blue-200">
                    <Link
                        to={`/netizens/${address}`}
                        className="hover:underline"
                    >
                        <Address
                            address={address as `0x${string}`}
                            showFullAddress={false}
                        />
                    </Link>
                </div>
                <Button
                    variant="secondary"
                    className="bg-gray-600"
                    onClick={() => disconnect()}
                >
                    Disconnect
                </Button>
            </div>
        );
    }
    return <ConnectOptions />;
}
