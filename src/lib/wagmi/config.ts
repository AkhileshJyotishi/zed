import { getDefaultConfig } from "connectkit"
import { createConfig, http } from "wagmi"

import { sonic } from "@/sonic"

const config = createConfig(
  getDefaultConfig({
    chains: [sonic],
    transports: {
      [sonic.id]: http(),
    },
    appName: "Zed",
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
  })
)

export default config
