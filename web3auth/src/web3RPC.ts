import type { IProvider } from "@web3auth/base";
import Web3 from "web3";

export default class EthereumRpc {
  private provider: IProvider;

  constructor(provider: IProvider) {
    this.provider = provider;
  }

  async getChainId(): Promise<string> {
    try {
      const web3 = new Web3(this.provider as any);

      // Get the connected Chain's ID
      const chainId = await web3.eth.getChainId();

      return chainId.toString();
    } catch (error) {
      return error as string;
    }
  }

  async getAccounts(): Promise<any> {
    try {
      const web3 = new Web3(this.provider as any);

      // Get user's Ethereum public address
      const address = await web3.eth.getAccounts();

      return address;
    } catch (error) {
      return error;
    }
  }

  async getBalance(): Promise<string> {
    try {
      const web3 = new Web3(this.provider as any);

      // Get user's Ethereum public address
      const address = (await web3.eth.getAccounts())[0];

      // Get user's balance in ether
      const balance = web3.utils.fromWei(
        await web3.eth.getBalance(address), // Balance is in wei
        "ether"
      );

      return balance;
    } catch (error) {
      return error as string;
    }
  }

  async sendTransaction(): Promise<any> {
    try {
      const web3 = new Web3(this.provider as any);

      // Get user's Ethereum public address
      const fromAddress = (await web3.eth.getAccounts())[0];
      const destination = fromAddress;
      const amount = web3.utils.toWei("0.001", "ether"); // Convert 1 ether to wei

      // Submit transaction to the blockchain and wait for it to be mined
      const receipt = await web3.eth.sendTransaction({
        from: fromAddress,
        to: destination,
        value: amount,
      });

      return receipt;
    } catch (error) {
      return error as string;
    }
  }

  async signMessage() {
    try {
      const web3 = new Web3(this.provider as any);

      // Get user's Ethereum public address
      const fromAddress = (await web3.eth.getAccounts())[0];

      const originalMessage = "This is a test message";

      // Sign the message
      const signedMessage = await web3.eth.personal.sign(
        originalMessage,
        fromAddress,
        "test password!" // configure your own password here.
      );

      return signedMessage;
    } catch (error) {
      return error as string;
    }
  }

  async readContract() {
    try {
      const web3 = new Web3(this.provider as any);

      const contractABI = [
        {
          inputs: [
            { internalType: "string", name: "initMessage", type: "string" },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          inputs: [],
          name: "getMessage",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            { internalType: "string", name: "newMessage", type: "string" },
          ],
          name: "updateMessage",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ];
      const contractAddress = "0x093451875d5A8D61bB90faA7A8645eB17c86b297"; // Sample contract deployed on Neon Devnet
      const contract = new web3.eth.Contract(
        JSON.parse(JSON.stringify(contractABI)),
        contractAddress
      );

      // Read message from smart contract
      const message = await contract.methods.getMessage().call();
      return message;
    } catch (error) {
      return error as string;
    }
  }

  async writeContract() {
    try {
      const web3 = new Web3(this.provider as any);

      const contractABI = [
        {
          inputs: [
            { internalType: "string", name: "initMessage", type: "string" },
          ],
          stateMutability: "nonpayable",
          type: "constructor",
        },
        {
          inputs: [],
          name: "getMessage",
          outputs: [{ internalType: "string", name: "", type: "string" }],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            { internalType: "string", name: "newMessage", type: "string" },
          ],
          name: "updateMessage",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ];
      const contractAddress = "0x093451875d5A8D61bB90faA7A8645eB17c86b297"; // Sample contract deployed on Neon Devnet
      const myContract = new web3.eth.Contract(
        JSON.parse(JSON.stringify(contractABI)),
        contractAddress
      );
      console.log(myContract);
      console.log((await web3.eth.getAccounts())[0]);
      // Generate random number between 1000 and 9000
      const randomNumber = Math.floor(Math.random() * 9000) + 1000;
      console.log(randomNumber);
      // Send transaction to smart contract to update message
      const receipt = await myContract.methods
        .updateMessage(`Web3Auth is awesome ${randomNumber} times!`)
        .send({
          from: `${(await web3.eth.getAccounts())[0]}`,
        });
      // console.log(receipt.transactionHash.toString());
      return receipt;
    } catch (error) {
      return error as string;
    }
  }
}
