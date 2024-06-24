// utils/connection.ts
import { Connection, clusterApiUrl } from "@solana/web3.js";

const network = "devnet";
const endpoint = clusterApiUrl(network);
const connection = new Connection(endpoint, "confirmed");

export default connection;
