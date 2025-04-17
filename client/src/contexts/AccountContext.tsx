import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SmartAccount } from 'viem/account-abstraction';

export interface AccountDetails {
    isPasskey?: boolean;
    isEphemeral?: boolean;
    createdAt: string;
    smartAccount: SmartAccount;
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
    isSmartAccountReady: boolean;
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

    // Check if smart account is ready
    const isSmartAccountReady = Boolean(account?.details?.smartAccount);

    return (
        <AccountContext.Provider value={{ account, setAccount, isSmartAccountReady }}>
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

// Helper hook to check if smart account is ready
export function useSmartAccount() {
    const { account, isSmartAccountReady } = useAccount();
    
    if (!isSmartAccountReady) {
        return null;
    }

    return account?.details.smartAccount;
} 