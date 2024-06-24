// context/GoogleSessionContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface GoogleSessionContextProps {
    session: string | null;
    setSession: (session: string) => void;
    mode: 'WIDGET' | 'BACKEND' | 'NOWIDGET';
    setMode: (mode: 'WIDGET' | 'BACKEND'| 'NOWIDGET') => void;
}

const GoogleSessionContext = createContext<GoogleSessionContextProps>({
    session: null,
    setSession: () => {},
    mode: 'WIDGET',
    setMode: () => {},
});

export const GoogleSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<string | null>(null);
    const [mode, setMode] = useState<'WIDGET' | 'BACKEND' | 'NOWIDGET'>('WIDGET');

    return (
        <GoogleSessionContext.Provider value={{ session, setSession, mode, setMode }}>
            {children}
        </GoogleSessionContext.Provider>
    );
};

export const useGoogleSession = () => useContext(GoogleSessionContext);
