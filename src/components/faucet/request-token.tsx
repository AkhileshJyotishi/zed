import React from "react"

import axios from "axios"
import { toast } from "sonner"

interface RequestTokenProps {
  address: `0x${string}`
}

const RequestToken: React.FC<RequestTokenProps> = ({ address }) => {

  const url = "http://localhost:3000/api/faucet";

  const handleRequest = async () => {
    try {
toast.info("Requesting airdrop...");
      const response = await axios.post(url, { address });
      if (response.data.transactionHash) {
        toast.success("Token request sent successfully")
      } else {
        toast.error("Unexpected response from the server");
      }
    } catch (error) {
      console.error("Error during transfer:", error);
      toast.error("Sonic transfer failed");
    }
  };

  return (
    <button
      className="transition-transfor mt-4 w-full transform rounded bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 font-bold text-white shadow-lg hover:from-green-500 hover:to-blue-600"
      onClick={handleRequest }
    >
      Request Sonic airdrop
    </button>
  )
}

export default RequestToken
