import {
  Connection,
  SendOptions,
  Signer,
  Transaction,
  TransactionSignature
} from '@solana/web3.js';
import { solanaTransactionLog } from '@neonevm/token-transfer';
import { Account, TransactionConfig } from 'web3-core';
import Web3 from 'web3';

export async function sendSolanaTransaction(connection: Connection, transaction: Transaction, signers: Signer[],
                                            confirm = false, options?: SendOptions): Promise<TransactionSignature> {
  transaction.sign(...signers);
  solanaTransactionLog(transaction);
  const signature = await connection.sendRawTransaction(transaction.serialize(), options);
  if (confirm) {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
  }
  return signature;
}

export async function sendNeonTransaction(web3: Web3, transaction: TransactionConfig, account: Account): Promise<string> {
  // @ts-ignore
  const signedTrx = await web3.eth.accounts.signTransaction(transaction, account.privateKey);
  return new Promise((resolve, reject) => {
    if (signedTrx?.rawTransaction) {
      web3.eth.sendSignedTransaction(signedTrx.rawTransaction, (error, hash) => {
        if (error) {
          reject(error);
        } else {
          resolve(hash);
        }
      });
    } else {
      reject('Unknown transaction');
    }
  });
}
