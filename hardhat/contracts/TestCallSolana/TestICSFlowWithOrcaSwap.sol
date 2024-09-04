// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import './interfaces/IERC20.sol';
import './interfaces/ICallSolana.sol';

contract TestICSFlowWithOrcaSwap {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);

    event LogData(bytes response);
    event CreateResource(bytes32 salt, uint64 space, uint64 lamports, bytes32 programId, bytes32 response);

    function getNeonAddress(address _address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(_address);
    }

    function getPayer() public view returns(bytes32) {
        return CALL_SOLANA.getPayer();
    }

    function getSolanaPDA(bytes32 program_id, bytes memory seeds) external view returns (bytes32) {
        return CALL_SOLANA.getSolanaPDA(program_id, seeds);
    }

    function getResourceAddress(bytes32 salt) external view returns (bytes32) {
        return CALL_SOLANA.getResourceAddress(salt);
    }

    function getExtAuthority(bytes32 salt) external view returns (bytes32) {
        return CALL_SOLANA.getExtAuthority(salt);
    }

    function salt(address account) external pure returns (bytes32) {
        return bytes32(uint256(uint160(account)));
    }

    function execute(
        address tokenIn,
        uint64 amount,
        uint64 lamports,
        bytes32 salt,
        bytes memory instruction
    ) external {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amount);

        //_execute(lamports, salt, instruction);
    }
}