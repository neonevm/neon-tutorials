const { ethers } = require("hardhat");
const { expect } = require("chai");
const web3 = require("@solana/web3.js");
const { mintTo } = require('@solana/spl-token');
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
    const TOKEN_MINT_OWNER_KEY = [78,81,129,107,97,54,158,166,105,36,148,243,127,227,221,104,173,237,82,88,9,40,125,84,72,58,18,127,64,4,57,72,233,61,118,28,77,199,152,180,254,202,218,160,248,36,159,200,62,127,19,152,24,46,235,35,129,7,252,152,27,95,24,62];
    const TOKEN_MINT = '0xa4a420d75f056d9cebb8eda13af07965261cb872b129f99b1ac94525ae8fded3'; // Custom SPLToken on Solana Devnet ( C5h24dhh9PjaVtHmf6CaqXbhi9SgrfwUSQt2MskWRLYr )
    const TOKEN_MINT_DECIMALS = 6;
    const INITIAL_OWNER_BALANCE = ethers.parseUnits('1000000', TOKEN_MINT_DECIMALS);
    const INITIAL_USER_BALANCE = ethers.parseUnits('150', TOKEN_MINT_DECIMALS);
    const RECEIPTS_COUNT = 30;

    before(async function() {
        [owner, user1, user2, user3] = await ethers.getSigners();

        let passedERC20ForSPLAddress = ethers.isAddress(ERC20ForSPLAddress);
        if (passedERC20ForSPLAddress) {
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

        if (!passedERC20ForSPLAddress) {
            // Initialize PDAs & mint dummy tokens for test users
            const keypair = web3.Keypair.fromSecretKey(Uint8Array.from(TOKEN_MINT_OWNER_KEY));
            let tx = await ERC20ForSPL.connect(owner).initializeAccount();
            await tx.wait(RECEIPTS_COUNT);
            
            tx = await ERC20ForSPL.connect(user1).initializeAccount();
            await tx.wait(RECEIPTS_COUNT);
            
            tx = await ERC20ForSPL.connect(user2).initializeAccount();
            await tx.wait(RECEIPTS_COUNT);

            await mintTo(
                connection,
                keypair,
                new web3.PublicKey(solanaProgramAddress),
                new web3.PublicKey(ownerSolanaPublicKey), 
                keypair,
                INITIAL_OWNER_BALANCE
            );

            await mintTo(
                connection,
                keypair,
                new web3.PublicKey(solanaProgramAddress),
                new web3.PublicKey(user1SolanaPublicKey), 
                keypair,
                INITIAL_USER_BALANCE
            );

            await mintTo(
                connection,
                keypair,
                new web3.PublicKey(solanaProgramAddress),
                new web3.PublicKey(user2SolanaPublicKey), 
                keypair,
                INITIAL_USER_BALANCE
            );
        }
    });

    it('validate test user balances', async function () {
        expect(await ERC20ForSPL.balanceOf(owner.address)).to.be.greaterThanOrEqual(INITIAL_OWNER_BALANCE);
        expect(await ERC20ForSPL.balanceOf(user1.address)).to.be.greaterThanOrEqual(INITIAL_USER_BALANCE);
        expect(await ERC20ForSPL.balanceOf(user2.address)).to.be.greaterThanOrEqual(INITIAL_USER_BALANCE);
    });

    it('validate owner', async function () {
        expect(await ERC20ForSPL.owner()).to.eq(owner.address);
    });

    it('validate totalSupply is equal', async function () {
        const tokenSupplyOnSolana = await connection.getTokenSupply(new web3.PublicKey(solanaProgramAddress));
        expect(await ERC20ForSPL.totalSupply()).to.eq(tokenSupplyOnSolana.value.amount);
    });

    it('validate decimals are equal', async function () {
        const mintDataOnSolana = await connection.getParsedAccountInfo(new web3.PublicKey(solanaProgramAddress));
        expect(await ERC20ForSPL.decimals()).to.eq(mintDataOnSolana.value.data.parsed.info.decimals);
    });

    it('burn from owner', async function () {
        const ownerBalance = await ERC20ForSPL.balanceOf(owner.address);
        const totalSupply = await ERC20ForSPL.totalSupply();
        const solanaOwnerTokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(ownerSolanaPublicKey));
        const solanaTotalSupply = await connection.getTokenSupply(new web3.PublicKey(solanaProgramAddress));

        const burnAmount = ethers.parseUnits('10', TOKEN_MINT_DECIMALS);
        let tx = await ERC20ForSPL.connect(owner).burn(burnAmount);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        expect(ownerBalance).to.be.greaterThan(await ERC20ForSPL.balanceOf(owner.address));
        expect(ownerBalance).to.eq(await ERC20ForSPL.balanceOf(owner.address) + burnAmount);
        expect(totalSupply).to.be.greaterThan(await ERC20ForSPL.totalSupply());

        // check from Solana node
        const solanaOwnerTokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(ownerSolanaPublicKey));
        expect(BigInt(solanaOwnerTokenBalance.value.amount)).to.be.greaterThan(solanaOwnerTokenBalanceAfter.value.amount);
        expect(BigInt(solanaOwnerTokenBalance.value.amount)).to.eq(BigInt(solanaOwnerTokenBalanceAfter.value.amount) + burnAmount);
        const solanaTotalSupplyAfter = await connection.getTokenSupply(new web3.PublicKey(solanaProgramAddress));
        expect(BigInt(solanaTotalSupply.value.amount)).to.be.greaterThan(BigInt(solanaTotalSupplyAfter.value.amount));
    });

    it('transfer from user1 to user2', async function () {
        const transferAmount = ethers.parseUnits('5', TOKEN_MINT_DECIMALS);
        let tx = await ERC20ForSPL.connect(user1).transfer(user2.address, transferAmount);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        expect(await ERC20ForSPL.balanceOf(user1.address)).to.eq(INITIAL_USER_BALANCE - transferAmount);
        expect(await ERC20ForSPL.balanceOf(user2.address)).to.eq(INITIAL_USER_BALANCE + transferAmount);

        // check from Solana node
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
        expect(solanaUser1TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE - transferAmount);
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
        expect(solanaUser2TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE + transferAmount);
    });

    it('transfer from user2 to user1', async function () {
        const transferAmount = ethers.parseUnits('5', TOKEN_MINT_DECIMALS);
        let tx = await ERC20ForSPL.connect(user2).transfer(user1.address, transferAmount);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        expect(await ERC20ForSPL.balanceOf(user1.address)).to.eq(INITIAL_USER_BALANCE);
        expect(await ERC20ForSPL.balanceOf(user2.address)).to.eq(INITIAL_USER_BALANCE);

        // check from Solana node
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
        expect(solanaUser1TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE);
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
        expect(solanaUser2TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE);
    });

    it('transfer from user1 to user2 using transferSolana', async function () {
        const user1Balance = await ERC20ForSPL.balanceOf(user1.address);
        const user2Balance = await ERC20ForSPL.balanceOf(user2.address);
        const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));

        const transferAmount = ethers.parseUnits('10', TOKEN_MINT_DECIMALS);
        let tx = await ERC20ForSPL.connect(user1).transferSolana(await ERC20ForSPL.solanaAccount(user2.address), transferAmount);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        const user1BalanceAfter = await ERC20ForSPL.balanceOf(user1.address);
        const user2BalanceAfter = await ERC20ForSPL.balanceOf(user2.address);
        expect(user1Balance).to.be.greaterThan(user1BalanceAfter);
        expect(user2BalanceAfter).to.be.greaterThan(user2Balance);

        // check from Solana node
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
        expect(BigInt(solanaUser1TokenBalance.value.amount)).to.be.greaterThan(BigInt(solanaUser1TokenBalanceAfter.value.amount));
        expect(BigInt(solanaUser2TokenBalanceAfter.value.amount)).to.be.greaterThan(BigInt(solanaUser2TokenBalance.value.amount));
    });

    it('transfer from user2 to user1 by using transferSolana', async function () {
        const user1Balance = await ERC20ForSPL.balanceOf(user1.address);
        const user2Balance = await ERC20ForSPL.balanceOf(user2.address);
        const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));

        const transferAmount = ethers.parseUnits('20', TOKEN_MINT_DECIMALS);
        let tx = await ERC20ForSPL.connect(user2).transferSolana(await ERC20ForSPL.solanaAccount(user1.address), transferAmount);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        const user1BalanceAfter = await ERC20ForSPL.balanceOf(user1.address);
        const user2BalanceAfter = await ERC20ForSPL.balanceOf(user2.address);
        expect(user1BalanceAfter).to.be.greaterThan(user1Balance);
        expect(user2Balance).to.be.greaterThan(user2BalanceAfter);

        // check from Solana node
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
        expect(BigInt(solanaUser1TokenBalanceAfter.value.amount)).to.be.greaterThan(BigInt(solanaUser1TokenBalance.value.amount));
        expect(BigInt(solanaUser2TokenBalance.value.amount)).to.be.greaterThan(BigInt(solanaUser2TokenBalanceAfter.value.amount));
    });

    it('approve from user2 to user1', async function () {
        const user2Allowance = await ERC20ForSPL.allowance(user2.address, user1.address);

        let tx = await ERC20ForSPL.connect(user2).approve(user1.address, ethers.parseUnits('1', TOKEN_MINT_DECIMALS));
        await tx.wait(RECEIPTS_COUNT);

        const user2AllowanceAfter = await ERC20ForSPL.allowance(user2.address, user1.address);
        expect(user2AllowanceAfter).to.be.greaterThan(user2Allowance);
    });
    
    it('transferFrom from user2 to user1', async function () {
        const user2Allowance = await ERC20ForSPL.allowance(user2.address, user1.address);
        const user1Balance = await ERC20ForSPL.balanceOf(user1.address);
        const user2Balance = await ERC20ForSPL.balanceOf(user2.address);
        const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));

        let tx = await ERC20ForSPL.connect(user1).transferFrom(user2.address, user1.address, user2Allowance);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        const user2AllowanceAfter = await ERC20ForSPL.allowance(user2.address, user1.address);
        const user1BalanceAfter = await ERC20ForSPL.balanceOf(user1.address);
        const user2BalanceAfter = await ERC20ForSPL.balanceOf(user2.address);
        expect(user2Allowance).to.be.greaterThan(user2AllowanceAfter);
        expect(user2AllowanceAfter).to.eq(0);
        expect(user1BalanceAfter).to.be.greaterThan(user1Balance);
        expect(user2Balance).to.be.greaterThan(user2BalanceAfter);

        // check from Solana node
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
        expect(BigInt(solanaUser1TokenBalanceAfter.value.amount)).to.be.greaterThan(BigInt(solanaUser1TokenBalance.value.amount));
        expect(BigInt(solanaUser2TokenBalance.value.amount)).to.be.greaterThan(BigInt(solanaUser2TokenBalanceAfter.value.amount));
    });

    it('approveSolana from user1 to user2 and owner; revoke with approveSolana', async function () {
        let amount = ethers.parseUnits('1', TOKEN_MINT_DECIMALS);
        let tx = await ERC20ForSPL.connect(user1).approveSolana(await ERC20ForSPL.solanaAccount(user2.address), amount);
        await tx.wait(RECEIPTS_COUNT);
        let accountDelegateData = await ERC20ForSPL.getAccountDelegateData(user1.address);
        expect(accountDelegateData[0]).to.eq(await ERC20ForSPL.solanaAccount(user2.address));
        expect(accountDelegateData[1]).to.eq(BigInt(amount));

        let amount1 = ethers.parseUnits('2', TOKEN_MINT_DECIMALS);
        let tx1 = await ERC20ForSPL.connect(user1).approveSolana(await ERC20ForSPL.solanaAccount(owner.address), amount1);
        await tx1.wait(RECEIPTS_COUNT);
        
        let accountDelegateData1 = await ERC20ForSPL.getAccountDelegateData(user1.address);
        expect(accountDelegateData1[0]).to.eq(await ERC20ForSPL.solanaAccount(owner.address));
        expect(accountDelegateData1[1]).to.eq(BigInt(amount1));

        // test revoke approveSolana
        let tx2 = await ERC20ForSPL.connect(user1).approveSolana(await ERC20ForSPL.solanaAccount(owner.address), 0);
        await tx2.wait(RECEIPTS_COUNT);
        
        let accountDelegateData2 = await ERC20ForSPL.getAccountDelegateData(user1.address);
        expect(accountDelegateData2[0]).to.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(accountDelegateData2[1]).to.eq(0);
    });

    it('Malicious transfer ( supposed to revert )', async function () {
        // user3 has no tokens at all
        await expect(
            ERC20ForSPL.connect(user3).transfer(user1.address, ethers.parseUnits('1', TOKEN_MINT_DECIMALS))
        ).to.be.reverted;
    });

    it('Malicious transferFrom ( supposed to revert )', async function () {
        // user3 has no approval at all
        await expect(
            ERC20ForSPL.connect(user3).transferFrom(user2.address, user3.address, ethers.parseUnits('1', TOKEN_MINT_DECIMALS))
        ).to.be.reverted;
    });

    it('Malicious burn ( supposed to revert )', async function () {
        // user3 has no tokens at all
        await expect(
            ERC20ForSPL.connect(user3).burn(ethers.parseUnits('1', TOKEN_MINT_DECIMALS))
        ).to.be.reverted;
    });

    it('Malicious uint64 overflow ( supposed to revert )', async function () {
        // 18446744073709551615 is the maximum uint64
        await expect(
            ERC20ForSPL.connect(user1).transfer(user2.address, '18446744073709551616')
        ).to.be.revertedWithCustomError(
            ERC20ForSPL,
            'AmountExceedsUint64'
        );

        await expect(
            ERC20ForSPL.connect(user1).burn('18446744073709551616')
        ).to.be.revertedWithCustomError(
            ERC20ForSPL,
            'AmountExceedsUint64'
        );
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
        const ownerBalance = await ERC20ForSPL.balanceOf(owner.address);
        const user1Balance = await ERC20ForSPL.balanceOf(user1.address);
        const user2Balance = await ERC20ForSPL.balanceOf(user2.address);
        const solanaOwnerTokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(ownerSolanaPublicKey));
        const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
        const solanaTotalSupply = await connection.getTokenSupply(new web3.PublicKey(solanaProgramAddress));

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
        const ownerBalanceAfter = await ERC20ForSPLV2.balanceOf(owner.address);
        const user1BalanceAfter = await ERC20ForSPLV2.balanceOf(user1.address);
        const user2BalanceAfter = await ERC20ForSPLV2.balanceOf(user2.address);
        expect(ERC20ForSPLV2.target).to.eq(ERC20ForSPL.target);
        expect(dummyDataInV2).to.eq(12345);
        expect(proxyOwner).to.eq(proxyOwnerAfter);
        expect(totalSupply).to.eq(totalSupplyAfter);
        expect(ownerBalance).to.eq(ownerBalanceAfter);
        expect(user1Balance).to.eq(user1BalanceAfter);
        expect(user2Balance).to.eq(user2BalanceAfter);

        // check from Solana node
        const solanaTotalSupplyAfter = await connection.getTokenSupply(new web3.PublicKey(solanaProgramAddress));
        const solanaOwnerTokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(ownerSolanaPublicKey));
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
        expect(solanaTotalSupply.value.amount).to.eq(solanaTotalSupplyAfter.value.amount);
        expect(solanaOwnerTokenBalance.value.amount).to.eq(solanaOwnerTokenBalanceAfter.value.amount);
        expect(solanaUser1TokenBalance.value.amount).to.eq(solanaUser1TokenBalanceAfter.value.amount);
        expect(solanaUser2TokenBalance.value.amount).to.eq(solanaUser2TokenBalanceAfter.value.amount);
    });
});