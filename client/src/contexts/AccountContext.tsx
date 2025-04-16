import { createContext, useContext, useState, ReactNode } from 'react';

export interface AccountDetails {
    isPasskey?: boolean;
    isEphemeral?: boolean;
    createdAt: string;
    privateKey?: `0x${string}`;
    smartAccount?: any; // Type this properly based on your smart account implementation
}

export interface Account {
    id: `0x${string}`; // Ethereum address
    name: string;
    username: string;
    details: AccountDetails;
}

interface AccountContextType {
    account: Account | null;
    setAccount: (account: Account | null) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<Account | null>(null);

    return (
        <AccountContext.Provider value={{ account, setAccount }}>
            {children}
        </AccountContext.Provider>
    );
}

export function useAccount() {
    const context = useContext(AccountContext);
    if (context === undefined) {
        throw new Error('useAccount must be used within an AccountProvider');
    }
    return context;
} 