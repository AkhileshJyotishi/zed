// File: app/api/send/route.ts

import { NextResponse } from "next/server";
import { ethers } from "ethers";

// Define the shape of the request body
interface SendRequestBody {
  address: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Parse the JSON payload from the frontend
    const body: SendRequestBody = await request.json();

    const { address } = body;
    console.log(address);
    
    if (!address) {
      throw new Error("Address is required.");
    }
    
    // Validate the address format
    if (!ethers.isAddress(address)) {
      throw new Error("Invalid address format.");
    }
    console.log("done");
    // Load environment variables for RPC URL and private key
    const rpcUrl = "https://rpc.blaze.soniclabs.com";
    const Key = process.env.KEY;
    if (!Key) {
      throw new Error("Missing environment variables:  PRIVATE_KEY");
    }
    console.log("here")
    // Set up provider and wallet using ethers.js
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(Key, provider);
    
    // Construct the transaction object to send 0.1 Sonic tokens
    const tx = {
      to: address,
      value: ethers.parseEther("1"),
    };
    
    // Send the transaction and wait for it to be mined
    const transaction = await wallet.sendTransaction(tx);
    await transaction.wait();
    
    return NextResponse.json(
      {
        message: "Transaction successful",
        transactionHash: transaction.hash,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error processing transaction:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
