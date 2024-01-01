const { ethers } = require("hardhat");
const { expect } = require("chai");
const web3 = require("@solana/web3.js");
const { PublicKey } = require("@solana/web3.js");
require("dotenv").config();

// define Solana Devnet connection
const connection = new web3.Connection("https://api.devnet.solana.com");

describe('Test init', async function () {
    let owner, user1, user2, user3;
    let ERC20ForSPLAddress;
    let ERC20ForSPL;
    let solanaProgramAddress;
    let ownerSolanaPublicKey;
    let user1SolanaPublicKey;
    let user2SolanaPublicKey;
    const SPL_DECIMALS = 9; // always 0 for ERC20ForSPL
    const INITIAL_OWNER_BALANCE = ethers.parseUnits('1000000', SPL_DECIMALS);
    const INITIAL_USER_BALANCE = ethers.parseUnits('150', SPL_DECIMALS);
    const RECEIPTS_COUNT = 30;
    // 0x0bd79ef4179d50678f8bb3b8573ae99bf66c8a2f74beab37970d386bc00367b4 // Custom token
    // 0xd0d6b2043fb14bea672e7e74fa09ce4a42e384bdc302e6d1d854127039afe07a // USDC Devnet
    const TOKEN_MINT = '0xd0d6b2043fb14bea672e7e74fa09ce4a42e384bdc302e6d1d854127039afe07a'; // USDC Devnet

    before(async function() {
        [owner, user1, user2, user3] = await ethers.getSigners();

        if (ethers.isAddress(ERC20ForSPLAddress)) {
            console.log('Creating instance of already deployed contract with address ', ERC20ForSPLAddress);
            ERC20ForSPL = await ethers.getContractAt('ERC20ForSPL', ERC20ForSPLAddress);
        } else {
            const ERC20ForSPLFactory = await hre.ethers.getContractFactory('ERC20ForSPL');
            ERC20ForSPL = await upgrades.deployProxy(ERC20ForSPLFactory, [
                TOKEN_MINT
            ], {kind: 'uups', initializer: 'initializeParent'});
            await ERC20ForSPL.waitForDeployment();
            ERC20ForSPLAddress = ERC20ForSPL.target;
            console.log('Creating instance of just now deployed contract with address ', ERC20ForSPL.target);
        }
        
        let mintAccount = await ERC20ForSPL.tokenMint();
        solanaProgramAddress = ethers.encodeBase58(mintAccount);
        ownerSolanaPublicKey = ethers.encodeBase58(await ERC20ForSPL.solanaAccount(owner.address));
        user1SolanaPublicKey = ethers.encodeBase58(await ERC20ForSPL.solanaAccount(user1.address));
        user2SolanaPublicKey = ethers.encodeBase58(await ERC20ForSPL.solanaAccount(user2.address));
        console.log(mintAccount, 'mintAccount');
        console.log(solanaProgramAddress, 'solanaProgramAddress');
        console.log(ownerSolanaPublicKey, 'ownerSolanaPublicKey');
        console.log(user1SolanaPublicKey, 'user1SolanaPublicKey');
        console.log(user2SolanaPublicKey, 'user2SolanaPublicKey');
    });

    it('validate owner', async function () {
        expect(await ERC20ForSPL.owner()).to.eq(owner.address);
    });

    it('validate totalSupply is equal', async function () {
        const tokenSupplyOnSolana = await connection.getTokenSupply(new PublicKey(solanaProgramAddress));
        expect(await ERC20ForSPL.totalSupply()).to.eq(tokenSupplyOnSolana.value.amount);
    });

    it('validate decimals are equal', async function () {
        const mintDataOnSolana = await connection.getParsedAccountInfo(new PublicKey(solanaProgramAddress));
        expect(await ERC20ForSPL.decimals()).to.eq(mintDataOnSolana.value.data.parsed.info.decimals);
    });

    it('Malicious change of owner ( supposed to revert )', async function () {
        await expect(
            ERC20ForSPL.connect(user1).transferOwnership(user1.address)
        ).to.be.reverted;
    });

    it('Malicious contract upgrade ( supposed to revert )', async function () {
        const ERC20ForSPLV2Factory = await ethers.getContractFactory("ERC20ForSPLV2", user1);
        await expect(
            upgrades.upgradeProxy(ERC20ForSPLAddress, ERC20ForSPLV2Factory)
        ).to.be.reverted;
    });

    it('Malicious implementation initialize ( supposed to revert )', async function () {
        const ERC20ForSPLImplementationAddress = await upgrades.erc1967.getImplementationAddress(ERC20ForSPL.target);
        console.log(ERC20ForSPLImplementationAddress, 'ERC20ForSPLImplementationAddress');
        const ERC20ForSPLFactory = await hre.ethers.getContractFactory('ERC20ForSPL');
        const ERC20ForSPLImplementation = await ERC20ForSPLFactory.attach(ERC20ForSPLImplementationAddress);

        await expect(
            ERC20ForSPLImplementation.initializeParent('0x0000000000000000000000000000000000000000000000000000000000000000')
        ).to.be.reverted;
    });

    it('Test UUPS contract upgrade', async function () {
        const proxyOwner = await ERC20ForSPL.owner();
        const totalSupply = await ERC20ForSPL.totalSupply();
        /* const ownerBalance = await ERC20ForSPL.balanceOf(owner.address);
        const user1Balance = await ERC20ForSPL.balanceOf(user1.address);
        const user2Balance = await ERC20ForSPL.balanceOf(user2.address);
        const solanaOwnerTokenBalance = await connection.getTokenAccountBalance(new PublicKey(ownerSolanaPublicKey));
        const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));
        const solanaTotalSupply = await connection.getTokenSupply(new PublicKey(solanaProgramAddress)); */

        const ERC20ForSPLV2Factory = await ethers.getContractFactory("ERC20ForSPLV2");
        const ERC20ForSPLV2 = await upgrades.upgradeProxy(ERC20ForSPLAddress, ERC20ForSPLV2Factory);
        await ERC20ForSPLV2.waitForDeployment();
        console.log("ERC20ForSPLV2 upgraded successfully");

        // just a work around to wait for ERC20ForSPLV2 to be mined onchain, because upgradeProxy doesn't support .wait()
        let tx = await owner.sendTransaction({
            to: owner.address,
            value: 0
        });
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        const dummyDataInV2 = await ERC20ForSPLV2.getDummyData();
        const proxyOwnerAfter = await ERC20ForSPLV2.owner();
        const totalSupplyAfter = await ERC20ForSPLV2.totalSupply();
        /* const ownerBalanceAfter = await ERC20ForSPLV2.balanceOf(owner.address);
        const user1BalanceAfter = await ERC20ForSPLV2.balanceOf(user1.address);
        const user2BalanceAfter = await ERC20ForSPLV2.balanceOf(user2.address); */
        expect(ERC20ForSPLV2.target).to.eq(ERC20ForSPL.target);
        expect(dummyDataInV2).to.eq(12345);
        expect(proxyOwner).to.eq(proxyOwnerAfter);
        expect(totalSupply).to.eq(totalSupplyAfter);
        /* expect(ownerBalance).to.eq(ownerBalanceAfter);
        expect(user1Balance).to.eq(user1BalanceAfter);
        expect(user2Balance).to.eq(user2BalanceAfter); */

        // check from Solana node
        /* const solanaTotalSupplyAfter = await connection.getTokenSupply(new PublicKey(solanaProgramAddress));
        const solanaOwnerTokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(ownerSolanaPublicKey));
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));
        expect(solanaTotalSupply.value.amount).to.eq(solanaTotalSupplyAfter.value.amount);
        expect(solanaOwnerTokenBalance.value.amount).to.eq(solanaOwnerTokenBalanceAfter.value.amount);
        expect(solanaUser1TokenBalance.value.amount).to.eq(solanaUser1TokenBalanceAfter.value.amount);
        expect(solanaUser2TokenBalance.value.amount).to.eq(solanaUser2TokenBalanceAfter.value.amount); */
    });
});