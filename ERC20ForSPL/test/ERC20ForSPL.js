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
        console.log(await ERC20ForSPL.balanceOf(owner.address), 'owner balance');
        console.log(await ERC20ForSPL.balanceOf(user1.address), 'user1 balance');
        console.log(await ERC20ForSPL.balanceOf(user2.address), 'user2 balance');
        console.log(await ERC20ForSPL.balanceOf(user3.address), 'user2 balance');
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
});