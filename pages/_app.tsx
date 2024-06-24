  
// pages/_app.tsx
import { AppProps } from 'next/app';
import { GoogleSessionProvider } from './context/GoogleSessionContext';
import dynamic from 'next/dynamic';

const WalletConnectionProvider = dynamic(() => import('./components/providers'), {
    ssr: false,
});

function MyApp({ Component, pageProps }: AppProps) {    
    return (
            <GoogleSessionProvider>
                <WalletConnectionProvider>
                    <Component {...pageProps} />
                </WalletConnectionProvider>
            </GoogleSessionProvider>
    );
}

export default MyApp;
