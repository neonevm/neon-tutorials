//
//
// Test purpose - Stake and unstake SOL on Solana through the TestStakeSOL contract using the composability feature
//
//
const {
    setUp,
    stake,
    initWithdraw,
    withdraw
} = require('./StakeSOL.js');

async function main() {
    const firstStakeAmount = 10000000; // 0.01 wSOL
    const secondStakeAmount = 20000000; // 0.02 wSOL
    const withdrawAmount =  firstStakeAmount + secondStakeAmount; // 0.03 wSOL

    console.log(firstStakeAmount, "firstStakeAmount")
    console.log(secondStakeAmount, "secondStakeAmount")
    console.log(withdrawAmount, "withdrawAmount")

    const setup = await setUp();
    await stake(setup, firstStakeAmount); // Stake firstStakeAmount
    await stake(setup, secondStakeAmount); // Stake again secondStakeAmount
    await initWithdraw(setup); // Deactivate stake (stake will be available to withdraw after end of current epoch)
    await withdraw(setup, withdrawAmount); // Withdraw stake (must wait until end of epoch after deactivating stake )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
