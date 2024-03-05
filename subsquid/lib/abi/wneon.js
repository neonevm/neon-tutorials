"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contract = exports.functions = exports.events = exports.abi = void 0;
const ethers = __importStar(require("ethers"));
const abi_support_1 = require("./abi.support");
const wneon_abi_1 = require("./wneon.abi");
exports.abi = new ethers.Interface(wneon_abi_1.ABI_JSON);
exports.events = {
    Approval: new abi_support_1.LogEvent(exports.abi, '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'),
    Transfer: new abi_support_1.LogEvent(exports.abi, '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'),
    Deposit: new abi_support_1.LogEvent(exports.abi, '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c'),
    Withdrawal: new abi_support_1.LogEvent(exports.abi, '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65'),
};
exports.functions = {
    name: new abi_support_1.Func(exports.abi, '0x06fdde03'),
    approve: new abi_support_1.Func(exports.abi, '0x095ea7b3'),
    totalSupply: new abi_support_1.Func(exports.abi, '0x18160ddd'),
    transferFrom: new abi_support_1.Func(exports.abi, '0x23b872dd'),
    withdraw: new abi_support_1.Func(exports.abi, '0x2e1a7d4d'),
    decimals: new abi_support_1.Func(exports.abi, '0x313ce567'),
    balanceOf: new abi_support_1.Func(exports.abi, '0x70a08231'),
    symbol: new abi_support_1.Func(exports.abi, '0x95d89b41'),
    transfer: new abi_support_1.Func(exports.abi, '0xa9059cbb'),
    deposit: new abi_support_1.Func(exports.abi, '0xd0e30db0'),
    allowance: new abi_support_1.Func(exports.abi, '0xdd62ed3e'),
};
class Contract extends abi_support_1.ContractBase {
    name() {
        return this.eth_call(exports.functions.name, []);
    }
    totalSupply() {
        return this.eth_call(exports.functions.totalSupply, []);
    }
    decimals() {
        return this.eth_call(exports.functions.decimals, []);
    }
    balanceOf(arg0) {
        return this.eth_call(exports.functions.balanceOf, [arg0]);
    }
    symbol() {
        return this.eth_call(exports.functions.symbol, []);
    }
    allowance(arg0, arg1) {
        return this.eth_call(exports.functions.allowance, [arg0, arg1]);
    }
}
exports.Contract = Contract;
