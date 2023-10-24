// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";


contract TestPyth {
    address public immutable pyth;

    constructor(address _pyth) {
        pyth = _pyth;
    }

    /// @notice Returns the price and confidence interval.
    /// @dev Reverts if the price has not been updated within the last `getValidTimePeriod()` seconds.
    function getPrice(bytes32 id) external view returns (PythStructs.Price memory) {
        return IPyth(pyth).getPrice(id);
    }

    /// @notice Returns the price of a price feed without any sanity checks.
    /// @dev This function returns the most recent price update in this contract without any recency checks.
    /// This function is unsafe as the returned price update may be arbitrarily far in the past.
    function getPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory) {
        return IPyth(pyth).getPriceUnsafe(id);
    }

    /// @notice Returns the required fee to update an array of price updates.
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint) {
        return IPyth(pyth).getUpdateFee(updateData);
    }

    /// @notice Update price feeds with given update messages.
    /// This method requires the caller to pay a fee in wei; the required fee can be computed by calling
    /// `getUpdateFee` with the length of the `updateData` array.
    /// Prices will be updated if they are more recent than the current stored prices.
    /// The call will succeed even if the update is not the most recent.
    /// @dev Reverts if the transferred fee is not sufficient or the updateData is invalid.
    function updatePriceFeeds(bytes[] calldata updateData) external payable {
        IPyth(pyth).updatePriceFeeds{value: msg.value}(updateData);
    }
}