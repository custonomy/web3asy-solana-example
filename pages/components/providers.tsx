import React, { FC, ReactNode, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { Web3asyWalletAdapter, WEB3ASY_MODE, WEB3ASY_NETWORK } from '@custonomy/custonomy-wallet-adapter';
import '@solana/wallet-adapter-react-ui/styles.css';
import { CUSTONOMY_APIKEY, CUSTONOMY_ENDPOINT, CUSTONOMY_PROJECT_ID, CUSTONOMY_APISECRET, SOL_CLUSTER, GOOGLE_CLIENT_ID } from '../constants';
import { useGoogleSession } from '../context/GoogleSessionContext';
import {
  BaseMessageSignerWalletAdapter
} from '@solana/wallet-adapter-base';
import { GoogleOAuthProvider } from '@react-oauth/google';

const getCluster = (cluster: string) => {
    switch (cluster) {
        case 'devnet':
            return WEB3ASY_NETWORK.SOL_DEVNET;
        case 'testnet':
            return WEB3ASY_NETWORK.SOL_TESTNET;
        case 'mainnet':
            return WEB3ASY_NETWORK.SOL_MAINNET;
        default:
            return WEB3ASY_NETWORK.SOL_DEVNET;
    }
}

const translateMode = (mode: string) => {
    switch (mode) {
        case 'BACKEND':
            return WEB3ASY_MODE.BACKEND;
        case 'WIDGET':
            return WEB3ASY_MODE.WIDGET;
        case 'NOWIDGET':
            return WEB3ASY_MODE.NOWIDGET;
        default:
            return WEB3ASY_MODE.BACKEND;
    }
}

const WalletConnectionProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const network = (SOL_CLUSTER ?? WalletAdapterNetwork.Devnet) as WalletAdapterNetwork ;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const { session: googleSession, mode } = useGoogleSession();

    const walletArray: BaseMessageSignerWalletAdapter[] = [];
    if (googleSession && mode === 'BACKEND') {
        walletArray.push(new Web3asyWalletAdapter({
            mode: translateMode(mode),
            params: {
                network: getCluster(SOL_CLUSTER ?? 'devnet'),
                projectId: CUSTONOMY_PROJECT_ID,
                endPoint: CUSTONOMY_ENDPOINT,
                apiKey: CUSTONOMY_APIKEY,
                apiSecret: CUSTONOMY_APISECRET,
                session: `GOOGLE:${googleSession}`,                
            }
        }));
    } else if (googleSession && mode === 'WIDGET') {
      walletArray.push(new Web3asyWalletAdapter({
        mode: translateMode(mode),
        params: {
            network: getCluster(SOL_CLUSTER ?? 'devnet'),
            projectId: CUSTONOMY_PROJECT_ID,
            endPoint: CUSTONOMY_ENDPOINT,
            apiKey: CUSTONOMY_APIKEY,
            session: `GOOGLE:${googleSession}`,
            window: window,
        }
    }));
    }  else if (googleSession && mode === 'NOWIDGET') {
        walletArray.push(new Web3asyWalletAdapter({
          mode: translateMode(mode),
          params: {
              network: getCluster(SOL_CLUSTER ?? 'devnet'),
              projectId: CUSTONOMY_PROJECT_ID,
              endPoint: CUSTONOMY_ENDPOINT,
              apiKey: CUSTONOMY_APIKEY,
              session: `GOOGLE:${googleSession}`,
              window: window,
              callback: ({id, status, callbackURL}: {id: string, status: string, callbackURL: string}) => {
                const iframeEle = document?.getElementById('embededFrame');
                const iframeDivEle = document?.getElementById('embededDiv');
                if (iframeDivEle != null && iframeEle != null) {
                    iframeDivEle.style.display = 'block';
                    iframeEle.src = `${callbackURL}&compact=true`;
                }
          }           
        }
      }));
      }else {
        walletArray.push(new PhantomWalletAdapter());
    }

    const wallets = useMemo(() => walletArray, [googleSession, mode]);
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>{children}</WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </GoogleOAuthProvider>
    );
};

export default dynamic(() => Promise.resolve(WalletConnectionProvider), { ssr: false });
