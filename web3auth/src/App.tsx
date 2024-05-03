import { useEffect, useState } from "react";
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import "./App.css";
import RPC from "./web3RPC"; // for using web3.js

// Providers
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

// Adapters
import { getDefaultExternalAdapters } from "@web3auth/default-evm-adapter";

const clientId =
  "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // get from https://dashboard.web3auth.io

// Neon EVM Devnet
const chainConfig = {
  chainId: "0xe9ac0ce",
  rpcTarget: "https://devnet.neonevm.org",
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  displayName: "Neon EVM Devnet",
  blockExplorerUrl: "https://devnet.neonscan.org",
  ticker: "NEON",
  tickerName: "Neon",
  logo: "",
};

// Neon EVM Mainnet
/* const chainConfig = {
    chainId: "0xe9ac0d6",
    rpcTarget: "https://neon-proxy-mainnet.solana.p2p.org",
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    displayName: "Neon EVM Mainnet",
    blockExplorerUrl: "https://neonscan.org",
    ticker: "NEON",
    tickerName: "Neon",
    logo: ""
}; */

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3AuthOptions: Web3AuthOptions = {
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  uiConfig: {
    uxMode: "redirect",
    appName: "W3A Heroes",
    appUrl: "https://web3auth.io/",
    theme: {
      primary: "#7ed6df",
    },
    logoLight: "https://web3auth.io/images/web3authlog.png",
    logoDark: "https://web3auth.io/images/web3authlogodark.png",
    defaultLanguage: "en", // en, de, ja, ko, zh, es, fr, pt, nl, tr
    mode: "auto", // whether to enable dark mode. defaultValue: auto
    useLogoLoader: true,
  },
  privateKeyProvider: privateKeyProvider,
  sessionTime: 86400, // 1 day
  // useCoreKitKey: true,
};

function App() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3Auth(web3AuthOptions as Web3AuthOptions);

        const openloginAdapter = new OpenloginAdapter({
          loginSettings: {
            mfaLevel: "optional",
          },
          adapterSettings: {
            uxMode: "redirect", // "redirect" | "popup"
            whiteLabel: {
              logoLight: "https://web3auth.io/images/web3authlog.png",
              logoDark: "https://web3auth.io/images/web3authlogodark.png",
              defaultLanguage: "en", // en, de, ja, ko, zh, es, fr, pt, nl, tr
              mode: "dark", // whether to enable dark, light or auto mode. defaultValue: auto [ system theme]
            },
            mfaSettings: {
              deviceShareFactor: {
                enable: true,
                priority: 1,
                mandatory: true,
              },
              backUpShareFactor: {
                enable: true,
                priority: 2,
                mandatory: false,
              },
              socialBackupFactor: {
                enable: true,
                priority: 3,
                mandatory: false,
              },
              passwordFactor: {
                enable: true,
                priority: 4,
                mandatory: false,
              },
            },
          },
        });
        web3auth.configureAdapter(openloginAdapter);

        // read more about adapters here: https://web3auth.io/docs/sdk/pnp/web/adapters/
        // Only when you want to add External default adapters, which includes WalletConnect, Metamask, Torus EVM Wallet
        const adapters = await getDefaultExternalAdapters({
          options: web3AuthOptions,
        });
        adapters.forEach((adapter) => {
          web3auth.configureAdapter(adapter);
        });

        setWeb3auth(web3auth);

        await web3auth.initModal();

        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    await web3auth.connect();
    setLoggedIn(true);
  };

  const logout = async () => {
    if (!web3auth) {
      uiConsole("web3auth not initialized yet");
      return;
    }
    //await web3auth.logout();
    localStorage.clear(); // fix because logout have issues with social logins
    window.location.reload(); // reloads the page and displays the login pop up again
    setLoggedIn(false);
  };

  const getChainId = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(web3auth.provider as IProvider);
    const chainId = await rpc.getChainId();
    uiConsole(chainId);
  };

  const getAccounts = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(web3auth.provider as IProvider);
    const address = await rpc.getAccounts();
    uiConsole(address);
  };

  const getBalance = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(web3auth.provider as IProvider);
    const balance = await rpc.getBalance();
    uiConsole(balance);
  };

  const sendTransaction = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(web3auth.provider as IProvider);
    const receipt = await rpc.sendTransaction();
    uiConsole(receipt);
  };

  const signMessage = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(web3auth.provider as IProvider);
    const signedMessage = await rpc.signMessage();
    uiConsole(signedMessage);
  };

  const readContract = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(web3auth.provider as IProvider);
    const message = await rpc.readContract();
    uiConsole(message);
  };

  const writeContract = async () => {
    if (!web3auth?.provider) {
      uiConsole("provider not initialized yet");
      return;
    }
    const rpc = new RPC(web3auth.provider as IProvider);
    const receipt = await rpc.writeContract();
    uiConsole(receipt);
    if (receipt) {
      setTimeout(async () => {
        await readContract();
      }, 2000);
    }
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
  }

  const loggedInView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={getChainId} className="card">
            Get Chain ID
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>
        <div>
          <button onClick={signMessage} className="card">
            Sign Message
          </button>
        </div>
        <div>
          <button onClick={sendTransaction} className="card">
            Send Transaction
          </button>
        </div>
        <div>
          <button onClick={readContract} className="card">
            Read Contract
          </button>
        </div>
        <div>
          <button onClick={writeContract} className="card">
            Write Contract
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </>
  );

  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a
          target="_blank"
          href="https://web3auth.io/docs/sdk/pnp/web/modal"
          rel="noreferrer"
        >
          Web3Auth{" "}
        </a>
        & ReactJS Neon EVM Example
      </h1>

      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>

      <footer className="footer">
        <a
          href="https://github.com/Web3Auth/web3auth-pnp-examples/tree/main/web-modal-sdk/blockchain-connection-examples/evm-modal-example"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
