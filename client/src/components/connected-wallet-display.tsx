import { useDisconnect } from "wagmi";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Address } from "./cns/address";
import { Link } from "react-router";

interface ConnectedWalletDisplayProps {
    address: `0x${string}`;
    isNetizen: boolean;
}

export function ConnectedWalletDisplay({ address, isNetizen }: ConnectedWalletDisplayProps) {
    const { disconnect } = useDisconnect();

    return (
        <div className="flex flex-row items-center gap-2">
            {isNetizen && (
                <Badge className="uppercase bg-yellow-500">netizen</Badge>
            )}
            {!isNetizen && (
                <Button
                    className="uppercase bg-yellow-500"
                    onClick={() => (window.location.href = "/naturalization")}
                >
                    become a CNS netizen
                </Button>
            )}
            <div className="text-blue-200">
                <Link to={`/netizens/${address}`} className="hover:underline">
                    <Address address={address} showFullAddress={false} />
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