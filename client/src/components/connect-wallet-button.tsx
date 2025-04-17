import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { checkIsNetizen } from "../lib/cns/get-cns-netizens";
import { ConnectOptions } from "./connect-options";
import { ConnectedWalletDisplay } from "./connected-wallet-display";

export function ConnectWalletButton() {
    const { address, isConnected } = useAccount();
    const [isNetizen, setIsNetizen] = useState(false);

    useEffect(() => {
        if (isConnected && address) {
            checkIsNetizen(address).then((bool) => {
                setIsNetizen(bool);
            });
        }
    }, [address, isConnected]);

    console.log("isConnected: >> ", isConnected, "address", address);
    if (isConnected && address) {
        return <ConnectedWalletDisplay address={address} isNetizen={isNetizen} />;
    }

    return <ConnectOptions />;
}
