import { lineaSepolia } from "viem/chains";

interface DelegatorEnvironment {
    DelegationManager: `0x${string}`;
}

const environments: Record<number, DelegatorEnvironment> = {
    [lineaSepolia.id]: {
        DelegationManager: import.meta.env.VITE_DELEGATION_MANAGER_ADDRESS as `0x${string}`,
    },
};

export function getDelegatorEnvironment(chainId: number): DelegatorEnvironment {
    const environment = environments[chainId];
    if (!environment) {
        throw new Error(`No delegator environment found for chain ID ${chainId}`);
    }
    return environment;
} 