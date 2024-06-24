
export const SOL_CLUSTER=process.env.NEXT_PUBLIC_SOL_CLUSTER ?? 'devnet';


export const CUSTONOMY_PROJECT_ID = process.env.NEXT_PUBLIC_CUSTONOMY_PROJECT_ID ?? '';
export const CUSTONOMY_ENDPOINT = process.env.NEXT_PUBLIC_CUSTONOMY_ENDPOINT ?? '';
export const CUSTONOMY_APIKEY = process.env.NEXT_PUBLIC_CUSTONOMY_APIKEY ?? '';

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
// !!!! CAUSTION, This is just an example of how to use a secret in the code, it is not recommended to use it this way
// This parameter must be kept securely and should not be exposed in the client side code
export const CUSTONOMY_APISECRET = process.env.NEXT_PUBLIC_CUSTONOMY_APISECRET ?? '';  


if (!process.env.NEXT_PUBLIC_CUSTONOMY_PROJECT_ID || !process.env.NEXT_PUBLIC_CUSTONOMY_ENDPOINT || !process.env.NEXT_PUBLIC_CUSTONOMY_APIKEY) {
  throw new Error('Environment variables CUSTONOMY_PROJECT_ID, CUSTONOMY_ENDPOINT and CUSTONOMY_APIKEY must be set');
}