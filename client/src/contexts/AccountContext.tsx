import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface AccountDetails {
    isPasskey?: boolean;
    isEphemeral?: boolean;
    createdAt: string;
    smartAccount: any; // This should be properly typed based on the MetaMask smart account type
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
    // Initialize state from localStorage
    const [account, setAccountState] = useState<Account | null>(() => {
        const saved = localStorage.getItem('currentAccount');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return null;
            }
        }
        return null;
    });

    // Wrapper for setAccount that also updates localStorage
    const setAccount = (newAccount: Account | null) => {
        setAccountState(newAccount);
        if (newAccount) {
            localStorage.setItem('currentAccount', JSON.stringify(newAccount));
        } else {
            localStorage.removeItem('currentAccount');
        }
    };

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