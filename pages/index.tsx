import { useState, useCallback, useEffect } from 'react';
import {
    PublicKey,
    SystemProgram,
    Transaction,
    VersionedTransaction,
    LAMPORTS_PER_SOL,
    Keypair,
    Connection,
    Signer,
    TransactionMessage,
} from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import {
    createInitializeMintInstruction,
    createInitializeAccountInstruction,
    createMintToInstruction,
    createTransferInstruction,
    getMinimumBalanceForRentExemptMint,
    getMinimumBalanceForRentExemptAccount,
    getTokenAccountBalance,
} from './utils/token_instructions';
import styles from './styles/Home.module.css';
import switchStyles from './styles/Switch.module.css';
import nacl from 'tweetnacl';
import { useGoogleSession } from './context/GoogleSessionContext';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { GOOGLE_CLIENT_ID, SOL_CLUSTER } from './constants';
import { Switch } from '@headlessui/react';  // Import the Switch component from Headless UI
import { WEB3ASY_MODE } from '@custonomy/custonomy-wallet-adapter';


function getSignersFromTransaction(transaction: Transaction): {publicKey: string, signature: string | undefined}[] {
    return transaction.signatures.map((signature) => ({publicKey: signature.publicKey.toBase58(), signature: signature.signature?.toString('hex')}));
}

const Home: React.FC = () => {
    const { connection } = useConnection();
    const { publicKey, signTransaction, signMessage, sendTransaction, disconnect } = useWallet();
    const { session, setSession, mode, setMode } = useGoogleSession(); // Include mode and setMode
    const [message, setMessage] = useState<string>('');
    const [isClient, setIsClient] = useState(false);
    const [balance, setBalance] = useState<number | null>(null);
    const [tokenBalance, setTokenBalance] = useState<number | null>(null);
    const [mintAddress, setMintAddress] = useState<PublicKey | null>(null);
    const [tokenAccountAddress, setTokenAccountAddress] = useState<PublicKey | null>(null);
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        setIsClient(true);
        if (publicKey) {
            getBalance();
            getTokenBalance();
        }
    }, [publicKey, mintAddress, tokenAccountAddress]);
    
    useEffect(() => {    
        const script = document.createElement("script");
        script.src = "https://cwidget2.custonomy.io/index.js";    
        document.body.appendChild(script);
        
        window.addEventListener("message", function(event) {
            var receivedMessage = event.data;

            console.log({event});
          
            if (receivedMessage.type === "closeCustonomyPopup") {
              var action = receivedMessage.action;
          
              // Handling different actions
              if (action === "submitted") {
                // The process was successfully submitted
                // Handle the submission completion here
                console.log("Account creation process submitted successfully.");
                const iframeDivEle = document?.getElementById('embededDiv');
                if (iframeDivEle != null) {
                    iframeDivEle.style.display = 'none';            
                }
              } else if (action === "manual_closed") {
                // The user manually closed the process (e.g., clicked cancel)
                // Handle the cancellation action here
                console.log("User manually closed the account creation process.");
                const iframeDivEle = document?.getElementById('embededDiv');
                if (iframeDivEle != null) {
                    iframeDivEle.style.display = 'none';            
                }

                setLoading((prev) => ({ ...prev, signTransaction: false, airdrop: false, signMessage: false, createMint: false, createTokenAccount: false, mintToken: false, transferToken: false, signTransactionV0: false, createMintV0: false, createTokenAccountV0: false, mintTokenV0: false, transferTokenV0: false }));
              }
            }
          });
        // Remove the script when the component is unmounted to prevent rendering error
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleLogout = useCallback(() => {
        disconnect();
        setMode('WIDGET');
        setSession('');
        setBalance(null);
        setTokenBalance(null);
        setMintAddress(null);
        setTokenAccountAddress(null);
        setMessage('Logged out successfully.');
    }, [disconnect, setSession]);

    const getBalance = useCallback(async () => {
        if (!publicKey) return;

        try {
            const balance = await connection.getBalance(publicKey);
            setBalance(balance / LAMPORTS_PER_SOL);
        } catch (error: any) {
            setMessage(`Failed to get balance: ${error.message}`);
        }
    }, [publicKey, connection]);

    const getTokenBalance = useCallback(async () => {
        if (!publicKey || !tokenAccountAddress) return;

        try {
            const balance = await getTokenAccountBalance(connection, tokenAccountAddress);
            setTokenBalance(balance);
        } catch (error: any) {
            setMessage(`Failed to get token balance: ${error.message}`);
        }
    }, [publicKey, connection, tokenAccountAddress]);

    const handleAirdrop = useCallback(async () => {
        if (!publicKey) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, airdrop: true }));
        try {
            const signature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
            await connection.confirmTransaction(signature, 'finalized');
            getBalance();
            setMessage(`Airdrop requested. Transaction Id: ${signature}`);
        } catch (error: any) {
            setMessage(`Airdrop failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, airdrop: false }));
        }
    }, [publicKey, connection, getBalance]);

    const handleSignTransaction = useCallback(async () => {
        if (!publicKey || !signTransaction || !sendTransaction) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, signTransaction: true }));
        try {
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: publicKey, // Keypair.generate().publicKey,
                    lamports: 1000000,
                })
            );
            const { blockhash } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            const signature = await sendTransaction(transaction, connection);
            setMessage(`Transaction signed and sent. Transaction Id: ${signature}`);
            await connection.confirmTransaction(signature, 'finalized');
            setMessage(`Transaction confirmed. Transaction Id: ${signature}`);
        } catch (error: any) {
            setMessage(`Transaction failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, signTransaction: false }));
        }
    }, [publicKey, signTransaction, sendTransaction, connection]);

    const handleSignMessage = useCallback(async () => {
        if (!publicKey || !signMessage) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, signMessage: true }));
        try {
            const message = new TextEncoder().encode('Hello, Solana!');
            const signedMessage = await signMessage(message);

            // Verify the signed message
            const signature = signedMessage.slice(0, 64);
            const signedData = signedMessage.slice(64);

            const verified = nacl.sign.detached.verify(signedData, signature, publicKey.toBuffer());
            if (verified) {
                setMessage(`Message signed and verified: ${Buffer.from(signedMessage).toString('hex')}`);
            } else {
                setMessage('Message verification failed.');
            }
        } catch (error: any) {
            setMessage(`Sign message failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, signMessage: false }));
        }
    }, [publicKey, signMessage]);

    const handleCreateMint = useCallback(async () => {
        if (!publicKey) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, createMint: true }));
        try {
            const mint = Keypair.generate();
            const mintRent = await getMinimumBalanceForRentExemptMint(connection);
            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: publicKey,
                    newAccountPubkey: mint.publicKey,
                    space: 82, // Mint account size
                    lamports: mintRent,
                    programId: TOKEN_PROGRAM_ID,
                }),
                createInitializeMintInstruction(mint.publicKey, 9, publicKey, publicKey)
            );

            const { blockhash } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            const signedTransaction = await signTransaction!(transaction);
            await signedTransaction.partialSign(mint);            
            const signature = await sendTransaction(signedTransaction, connection);
            
            setMessage(`Transaction signed and sent, waiting for confirmation. Transaction Id: ${signature}`);
            await connection.confirmTransaction(signature, 'finalized');

            setMintAddress(mint.publicKey);
            setMessage(`Mint created with address: ${mint.publicKey.toString()}\r\nTransaction Id: ${signature}`);
        } catch (error: any) {
            console.error(error);
            setMessage(`Mint creation failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, createMint: false }));
        }
    }, [publicKey, connection, signTransaction]);

    const handleCreateTokenAccount = useCallback(async () => {
        if (!publicKey || !mintAddress) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, createTokenAccount: true }));
        try {
            const tokenAccount = Keypair.generate();
            const accountRent = await getMinimumBalanceForRentExemptAccount(connection);
            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: publicKey,
                    newAccountPubkey: tokenAccount.publicKey,
                    space: 165, // Token account size
                    lamports: accountRent,
                    programId: TOKEN_PROGRAM_ID,
                }),
                createInitializeAccountInstruction(tokenAccount.publicKey, mintAddress, publicKey)
            );

            const { blockhash } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            const signedTransaction = await signTransaction!(transaction);
            signedTransaction.partialSign(tokenAccount);

            const signers = getSignersFromTransaction(signedTransaction);

            const signature = await sendTransaction(signedTransaction, connection);
            await connection.confirmTransaction(signature, 'finalized');

            setTokenAccountAddress(tokenAccount.publicKey);
            setMessage(`Token account created with address: ${tokenAccount.publicKey.toString()}\r\nTransaction Id: ${signature}`);
        } catch (error: any) {
            setMessage(`Token account creation failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, createTokenAccount: false }));
        }
    }, [publicKey, connection, mintAddress, signTransaction]);

    const handleMintToken = useCallback(async () => {
        if (!publicKey || !mintAddress || !tokenAccountAddress) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, mintToken: true }));
        try {
            const transaction = new Transaction().add(
                createMintToInstruction(mintAddress, tokenAccountAddress, publicKey, 1000)
            );

            const { blockhash } = await connection.getLatestBlockhash('finalized');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            const signedTransaction = await signTransaction!(transaction);

            const signature = await sendTransaction(signedTransaction, connection);
            await connection.confirmTransaction(signature, 'finalized');

            setMessage(`Token minted and 1000 tokens sent to ${tokenAccountAddress.toString()}\r\nTransaction Id: ${signature}`);
            getTokenBalance();
        } catch (error: any) {
            setMessage(`Token minting failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, mintToken: false }));
        }
    }, [publicKey, connection, mintAddress, tokenAccountAddress, signTransaction, getTokenBalance]);

    const handleTransferToken = useCallback(async () => {
        if (!publicKey || !mintAddress || !tokenAccountAddress) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, transferToken: true }));
        try {
            const transaction = new Transaction().add(
                createTransferInstruction(tokenAccountAddress, tokenAccountAddress, publicKey, 500)
            );

            const { blockhash } = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;

            const signedTransaction = await signTransaction!(transaction);
            const signature = await sendTransaction(signedTransaction, connection);
            await connection.confirmTransaction(signature, 'finalized');

            setMessage(`500 tokens transferred to ${tokenAccountAddress.toString()}\r\nTransaction Id: ${signature}`);
            getTokenBalance();
        } catch (error: any) {
            setMessage(`Token transfer failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, transferToken: false }));
        }
    }, [publicKey, connection, mintAddress, tokenAccountAddress, signTransaction, getTokenBalance]);

    const handleSignTransactionV0 = useCallback(async () => {
        if (!publicKey || !signTransaction || !sendTransaction) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, signTransactionV0: true }));
        try {
            const instructions = [
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: publicKey, // Keypair.generate().publicKey,
                    lamports: 1000000,
                })
            ];

            const { blockhash } = await connection.getRecentBlockhash();

            const message = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: blockhash,
                instructions,
            }).compileToV0Message();

            const versionedTransaction = new VersionedTransaction(message);
            const signedTransaction = await signTransaction!(versionedTransaction);

            const signature = await sendTransaction(signedTransaction, connection);
            setMessage(`Transaction (v0) signed and sent. Transaction Id: ${signature}`);
            await connection.confirmTransaction(signature, 'finalized');
            setMessage(`Transaction (v0) confirmed. Transaction Id: ${signature}`);
        } catch (error: any) {
            console.error(error);
            setMessage(`Transaction (v0) failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, signTransactionV0: false }));
        }
    }, [publicKey, connection, signTransaction, sendTransaction]);

    const handleCreateMintV0 = useCallback(async () => {
        if (!publicKey) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, createMintV0: true }));
        try {
            const mint = Keypair.generate();
            const mintRent = await getMinimumBalanceForRentExemptMint(connection);
            const instructions = [
                SystemProgram.createAccount({
                    fromPubkey: publicKey,
                    newAccountPubkey: mint.publicKey,
                    space: 82, // Mint account size
                    lamports: mintRent,
                    programId: TOKEN_PROGRAM_ID,
                }),
                createInitializeMintInstruction(mint.publicKey, 9, publicKey, publicKey),
            ];

            const { blockhash } = await connection.getRecentBlockhash();

            const message = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: blockhash,
                instructions,
            }).compileToV0Message();

            const versionedTransaction = new VersionedTransaction(message);
            const signedTransaction = await signTransaction!(versionedTransaction);

            signedTransaction.sign([mint]);

            const result = await connection.simulateTransaction(signedTransaction);
            const signature = await sendTransaction(signedTransaction, connection);
            await connection.confirmTransaction(signature, 'finalized');
            setMintAddress(mint.publicKey);
            setMessage(`Mint (v0) created with address: ${mint.publicKey.toString()}\r\nTransaction Id: ${signature}`);
        } catch (error: any) {
            console.error(error);
            setMessage(`Mint creation (v0) failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, createMintV0: false }));
        }
    }, [publicKey, connection, signTransaction]);

    const handleCreateTokenAccountV0 = useCallback(async () => {
        if (!publicKey || !mintAddress) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, createTokenAccountV0: true }));
        try {
            const tokenAccount = Keypair.generate();
            const accountRent = await getMinimumBalanceForRentExemptAccount(connection);
            const instructions = [
                SystemProgram.createAccount({
                    fromPubkey: publicKey,
                    newAccountPubkey: tokenAccount.publicKey,
                    space: 165, // Token account size
                    lamports: accountRent,
                    programId: TOKEN_PROGRAM_ID,
                }),
                createInitializeAccountInstruction(tokenAccount.publicKey, mintAddress, publicKey),
            ];

            const { blockhash } = await connection.getRecentBlockhash();

            const message = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: blockhash,
                instructions,
            }).compileToV0Message();

            const versionedTransaction = new VersionedTransaction(message);
            const signedTransaction = await signTransaction!(versionedTransaction);
            signedTransaction.sign([tokenAccount]);

            const signature = await sendTransaction(signedTransaction, connection);
            await connection.confirmTransaction(signature, 'finalized');

            setTokenAccountAddress(tokenAccount.publicKey);
            setMessage(`Token account (v0) created with address: ${tokenAccount.publicKey.toString()}\r\nTransaction Id: ${signature}`);
        } catch (error: any) {
            setMessage(`Token account creation (v0) failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, createTokenAccountV0: false }));
        }
    }, [publicKey, connection, mintAddress, signTransaction]);

    const handleMintTokenV0 = useCallback(async () => {
        if (!publicKey || !mintAddress || !tokenAccountAddress) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, mintTokenV0: true }));
        try {
            setMessage('Signing Request Initiated');
            const instructions = [
                createMintToInstruction(mintAddress, tokenAccountAddress, publicKey, 1000),
            ];

            const { blockhash } = await connection.getRecentBlockhash();

            const message = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: blockhash,
                instructions,
            }).compileToV0Message();

            setMessage('Signing InProgress...');
            const versionedTransaction = new VersionedTransaction(message);
            const signedTransaction = await signTransaction!(versionedTransaction);

            const signature = await sendTransaction(signedTransaction, connection);
            setMessage('Waiting Confirmation');
            await connection.confirmTransaction(signature, 'finalized');

            setMessage(`Token (v0) minted and 1000 tokens sent to ${tokenAccountAddress.toString()}\r\nTransaction Id: ${signature}`);
            getTokenBalance();
        } catch (error: any) {
            setMessage(`Token minting (v0) failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, mintTokenV0: false }));
        }
    }, [publicKey, connection, mintAddress, tokenAccountAddress, signTransaction, getTokenBalance]);

    const handleTransferTokenV0 = useCallback(async () => {
        if (!publicKey || !mintAddress || !tokenAccountAddress) return;

        setMessage('');  // Clear the message
        setLoading((prev) => ({ ...prev, transferTokenV0: true }));
        try {
            const instructions = [
                createTransferInstruction(tokenAccountAddress, tokenAccountAddress, publicKey, 500),
            ];

            const { blockhash } = await connection.getRecentBlockhash();

            const message = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: blockhash,
                instructions,
            }).compileToV0Message();

            const versionedTransaction = new VersionedTransaction(message);
            const signedTransaction = await signTransaction!(versionedTransaction);

            const signature = await sendTransaction(signedTransaction, connection);
            await connection.confirmTransaction(signature, 'finalized');

            setMessage(`500 tokens (v0) transferred to ${tokenAccountAddress.toString()}\r\nTransaction Id: ${signature}`);
            getTokenBalance();
        } catch (error: any) {
            setMessage(`Token transfer (v0) failed: ${error.message}`);
        } finally {
            setLoading((prev) => ({ ...prev, transferTokenV0: false }));
        }
    }, [publicKey, connection, mintAddress, tokenAccountAddress, signTransaction, getTokenBalance]);

    const handleModeSwitch = (newmode: 'BACKEND' | 'WIDGET' | 'NOWIDGET') => {
        setMode(newmode);
    }

    if (!isClient) {
        return null;
    }

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <h1 className={styles.title}>Web3asy Wallet Adapter Exmaple</h1>
                <h2 className={styles.title2}>Network: {SOL_CLUSTER}</h2>
                <div className={switchStyles.switchContainer}>
                    <label className={switchStyles.radioLabel}>
                        <input
                            type="radio"
                            name="mode"
                            value={'WIDGET'}
                            checked={mode === 'WIDGET'}
                            onChange={()=>handleModeSwitch('WIDGET')}
                            disabled={!!publicKey}
                        />
                        <span className={switchStyles.customRadio}></span>
                        <span>Widget Mode</span>
                        
                    </label>                    
                    <label className={switchStyles.radioLabel}>
                        <input
                            type="radio"
                            name="mode"
                            value={'NOWIDGET'}
                            checked={mode === 'NOWIDGET'}
                            onChange={()=>handleModeSwitch('NOWIDGET')}
                            disabled={!!publicKey}
                        />
                        <span className={switchStyles.customRadio}></span>
                        Embeded Mode
                    </label>
                    <label className={switchStyles.radioLabel}>
                        <input
                            type="radio"
                            name="mode"
                            value={'BACKEND'}
                            checked={mode === 'BACKEND'}
                            onChange={()=>handleModeSwitch('BACKEND')}
                            disabled={!!publicKey}
                        />
                        <span className={switchStyles.customRadio}></span>
                        Backend Mode
                    </label>
                </div>
                <div className={styles.walletbutton}>
                    {(!publicKey || mode == 'BACKEND') && <WalletMultiButton />} {!session && '- Or -'}
                    {!session && <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                        <GoogleLogin
                            onSuccess={credentialResponse => {
                                setMessage(`Google login successful!`);
                                setSession(credentialResponse.credential ?? ''); // Set the session token
                            }}
                            onError={() => {
                                console.log('Login Failed');
                                setMessage(`Google login failed.`);
                            }}
                        />
                    </GoogleOAuthProvider>}
                    { mode == 'WIDGET' ? <div id="custonomy_widget" style={{ display: session && publicKey ? 'block' : 'none' }} /> : <></>}
                </div>                
                {publicKey && (
                    <div className={styles.grid}>                        
                        <div className={styles.column}>
                            <h2>Sign In</h2>
                            <button className={styles.button} onClick={handleAirdrop} disabled={loading.airdrop}>
                                {loading.airdrop ? 'Signing In Progress...' : 'Request Airdrop'}
                            </button>
                            <p className={styles.description}>Connected: {publicKey.toString()}</p>
                            <p className={styles.description}>Balance: {balance} SOL</p>
                            <p className={styles.description}>Token Balance: {tokenBalance} tokens</p>
                            <p></p>
                            
                        </div>
                        <div id='embededDiv' className={styles.column} style={{display: 'none'}}>
                            <iframe name='embededFrame' id='embededFrame' style={{border: '0px', height: '780px', width: '400px'}}></iframe>
                        </div>
                        <div className={styles.column}>
                            <h2>Legacy Transactions</h2>
                            <div className={styles.buttonGroup}>
                                <button className={styles.button} onClick={handleSignTransaction} disabled={loading.signTransaction}>
                                    {loading.signTransaction ? 'Signing In Progress...' : 'Sign and Send Transaction'}
                                </button>
                                <button className={styles.button} onClick={handleSignMessage} disabled={loading.signMessage}>
                                    {loading.signMessage ? 'Signing In Progress...' : 'Sign Message'}
                                </button>
                                <button className={styles.button} onClick={handleCreateMint} disabled={loading.createMint}>
                                    {loading.createMint ? 'Signing In Progress...' : 'Create Mint'}
                                </button>
                                <button className={styles.button} onClick={handleCreateTokenAccount} disabled={!mintAddress || loading.createTokenAccount}>
                                    {loading.createTokenAccount ? 'Signing In Progress...' : 'Create Token Account'}
                                </button>
                                <button className={styles.button} onClick={handleMintToken} disabled={!tokenAccountAddress || loading.mintToken}>
                                    {loading.mintToken ? 'Signing In Progress...' : 'Mint Token'}
                                </button>
                                <button className={styles.button} onClick={handleTransferToken} disabled={!tokenAccountAddress || loading.transferToken}>
                                    {loading.transferToken ? 'Signing In Progress...' : 'Transfer Token'}
                                </button>
                            </div>
                        </div>
                        <div className={styles.column}>
                            <h2>Versioned Transactions</h2>
                            <div className={styles.buttonGroup}>
                                <button className={styles.button} onClick={handleSignTransactionV0} disabled={loading.signTransactionV0}>
                                    {loading.signTransactionV0 ? 'Signing In Progress...' : 'Sign and Send Transaction (v0)'}
                                </button>
                                <button className={styles.button} onClick={handleCreateMintV0} disabled={loading.createMintV0}>
                                    {loading.createMintV0 ? 'Signing In Progress...' : 'Create Mint (v0)'}
                                </button>
                                <button className={styles.button} onClick={handleCreateTokenAccountV0} disabled={!mintAddress || loading.createTokenAccountV0}>
                                    {loading.createTokenAccountV0 ? 'Signing In Progress...' : 'Create Token Account (v0)'}
                                </button>
                                <button className={styles.button} onClick={handleMintTokenV0} disabled={!tokenAccountAddress || loading.mintTokenV0}>
                                    {loading.mintTokenV0 ? 'Signing In Progress...' : 'Mint Token (v0)'}
                                </button>
                                <button className={styles.button} onClick={handleTransferTokenV0} disabled={!tokenAccountAddress || loading.transferTokenV0}>
                                    {loading.transferTokenV0 ? 'Signing In Progress...' : 'Transfer Token (v0)'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                 {(session || publicKey) && (
                    <button className={styles.button} onClick={handleLogout}>
                        Logout
                    </button>
                )}
                {message && <p className={styles.message}>{message}</p>}
            </main>
        </div>
    );
};

export default Home;
