import * as ethers from 'ethers'
import {LogEvent, Func, ContractBase} from './abi.support'
import {ABI_JSON} from './wneon.abi'

export const abi = new ethers.Interface(ABI_JSON);

export const events = {
    Approval: new LogEvent<([src: string, guy: string, wad: bigint] & {src: string, guy: string, wad: bigint})>(
        abi, '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'
    ),
    Transfer: new LogEvent<([src: string, dst: string, wad: bigint] & {src: string, dst: string, wad: bigint})>(
        abi, '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    ),
    Deposit: new LogEvent<([dst: string, wad: bigint] & {dst: string, wad: bigint})>(
        abi, '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c'
    ),
    Withdrawal: new LogEvent<([src: string, wad: bigint] & {src: string, wad: bigint})>(
        abi, '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65'
    ),
}

export const functions = {
    name: new Func<[], {}, string>(
        abi, '0x06fdde03'
    ),
    approve: new Func<[guy: string, wad: bigint], {guy: string, wad: bigint}, boolean>(
        abi, '0x095ea7b3'
    ),
    totalSupply: new Func<[], {}, bigint>(
        abi, '0x18160ddd'
    ),
    transferFrom: new Func<[src: string, dst: string, wad: bigint], {src: string, dst: string, wad: bigint}, boolean>(
        abi, '0x23b872dd'
    ),
    withdraw: new Func<[wad: bigint], {wad: bigint}, []>(
        abi, '0x2e1a7d4d'
    ),
    decimals: new Func<[], {}, number>(
        abi, '0x313ce567'
    ),
    balanceOf: new Func<[_: string], {}, bigint>(
        abi, '0x70a08231'
    ),
    symbol: new Func<[], {}, string>(
        abi, '0x95d89b41'
    ),
    transfer: new Func<[dst: string, wad: bigint], {dst: string, wad: bigint}, boolean>(
        abi, '0xa9059cbb'
    ),
    deposit: new Func<[], {}, []>(
        abi, '0xd0e30db0'
    ),
    allowance: new Func<[_: string, _: string], {}, bigint>(
        abi, '0xdd62ed3e'
    ),
}

export class Contract extends ContractBase {

    name(): Promise<string> {
        return this.eth_call(functions.name, [])
    }

    totalSupply(): Promise<bigint> {
        return this.eth_call(functions.totalSupply, [])
    }

    decimals(): Promise<number> {
        return this.eth_call(functions.decimals, [])
    }

    balanceOf(arg0: string): Promise<bigint> {
        return this.eth_call(functions.balanceOf, [arg0])
    }

    symbol(): Promise<string> {
        return this.eth_call(functions.symbol, [])
    }

    allowance(arg0: string, arg1: string): Promise<bigint> {
        return this.eth_call(functions.allowance, [arg0, arg1])
    }
}
