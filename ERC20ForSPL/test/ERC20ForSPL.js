const { ethers } = require("hardhat");
const { expect } = require("chai");
const web3 = require("@solana/web3.js");
const { PublicKey } = require("@solana/web3.js");
require("dotenv").config();

// define Solana Devnet connection
const connection = new web3.Connection("https://api.devnet.solana.com");

describe('Test init', async function () {
    let owner, user1, user2, user3;
    let ERC20ForSPLMintableAddress;
    let ERC20ForSPLMintable;
    let solanaProgramAddress;
    let ownerSolanaPublicKey;
    let user1SolanaPublicKey;
    let user2SolanaPublicKey;
    const SPL_DECIMALS = 9; // always 0 for ERC20ForSPL
    const INITIAL_OWNER_BALANCE = ethers.parseUnits('1000000', SPL_DECIMALS);
    const INITIAL_USER_BALANCE = ethers.parseUnits('150', SPL_DECIMALS);
    const RECEIPTS_COUNT = 30;

    before(async function() {
        [owner, user1, user2, user3] = await ethers.getSigners();

        if (ethers.isAddress(ERC20ForSPLMintableAddress)) {
            console.log('Creating instance of already deployed contract with address ', ERC20ForSPLMintableAddress);
            ERC20ForSPLMintable = await ethers.getContractAt('ERC20ForSPLMintable', ERC20ForSPLMintableAddress);
        } else {
            const ERC20ForSPLMintableFactory = await hre.ethers.getContractFactory('ERC20ForSPLMintable');
            ERC20ForSPLMintable = await upgrades.deployProxy(ERC20ForSPLMintableFactory, [
                'Testcoin',
                'TST',
                9
            ], {kind: 'uups'});
            await ERC20ForSPLMintable.waitForDeployment();
            ERC20ForSPLMintableAddress = ERC20ForSPLMintable.target;
            console.log('Creating instance of just now deployed contract with address ', ERC20ForSPLMintable.target);
        }
        solanaProgramAddress = ethers.encodeBase58(await ERC20ForSPLMintable.findMintAccount());
        ownerSolanaPublicKey = ethers.encodeBase58(await ERC20ForSPLMintable.solanaAccount(owner.address));
        user1SolanaPublicKey = ethers.encodeBase58(await ERC20ForSPLMintable.solanaAccount(user1.address));
        user2SolanaPublicKey = ethers.encodeBase58(await ERC20ForSPLMintable.solanaAccount(user2.address));
        console.log(solanaProgramAddress, 'solanaProgramAddress');
        console.log(ownerSolanaPublicKey, 'ownerSolanaPublicKey');
        console.log(user1SolanaPublicKey, 'user1SolanaPublicKey');
        console.log(user2SolanaPublicKey, 'user2SolanaPublicKey');
    });

    it('validate owner', async function () {
        expect(await ERC20ForSPLMintable.owner()).to.eq(owner.address);
    });

    it('validate totalSupply is 0', async function () {
        expect(await ERC20ForSPLMintable.totalSupply()).to.eq(0);
    });

    it('validate balanceOf or all users is 0', async function () {
        expect(await ERC20ForSPLMintable.balanceOf(owner.address)).to.eq(0);
        expect(await ERC20ForSPLMintable.balanceOf(user1.address)).to.eq(0);
        expect(await ERC20ForSPLMintable.balanceOf(user2.address)).to.eq(0);
        expect(await ERC20ForSPLMintable.balanceOf(user3.address)).to.eq(0);
    });

    it('mint from owner', async function () {
        let tx = await ERC20ForSPLMintable.connect(owner).mint(owner.address, INITIAL_OWNER_BALANCE);
        await tx.wait(RECEIPTS_COUNT);
        let tx1 = await ERC20ForSPLMintable.connect(owner).mint(user1.address, INITIAL_USER_BALANCE);
        await tx1.wait(RECEIPTS_COUNT);
        let tx2 = await ERC20ForSPLMintable.connect(owner).mint(user2.address, INITIAL_USER_BALANCE);
        await tx2.wait(RECEIPTS_COUNT);

        // check from Neon node
        expect(await ERC20ForSPLMintable.balanceOf(owner.address)).to.eq(INITIAL_OWNER_BALANCE);
        expect(await ERC20ForSPLMintable.balanceOf(user1.address)).to.eq(INITIAL_USER_BALANCE);
        expect(await ERC20ForSPLMintable.balanceOf(user2.address)).to.eq(INITIAL_USER_BALANCE);
        expect(await ERC20ForSPLMintable.totalSupply()).to.eq(INITIAL_OWNER_BALANCE + INITIAL_USER_BALANCE + INITIAL_USER_BALANCE);

        // check from Solana node
        const solanaOwnerTokenBalance = await connection.getTokenAccountBalance(new PublicKey(ownerSolanaPublicKey));
        const user1SolanaTokenBalance = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        const user2SolanaTokenBalance = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        expect(solanaOwnerTokenBalance.value.amount).to.eq(INITIAL_OWNER_BALANCE);
        expect(user1SolanaTokenBalance.value.amount).to.eq(INITIAL_USER_BALANCE);
        expect(user2SolanaTokenBalance.value.amount).to.eq(INITIAL_USER_BALANCE);
    });

    it('burn from owner', async function () {
        const ownerBalance = await ERC20ForSPLMintable.balanceOf(owner.address);
        const totalSupply = await ERC20ForSPLMintable.totalSupply();
        const solanaOwnerTokenBalance = await connection.getTokenAccountBalance(new PublicKey(ownerSolanaPublicKey));
        const solanaTotalSupply = await connection.getTokenSupply(new PublicKey(solanaProgramAddress));

        const burnAmount = ethers.parseUnits('10', SPL_DECIMALS);
        let tx = await ERC20ForSPLMintable.connect(owner).burn(burnAmount);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        expect(ownerBalance).to.be.greaterThan(await ERC20ForSPLMintable.balanceOf(owner.address));
        expect(ownerBalance).to.eq(await ERC20ForSPLMintable.balanceOf(owner.address) + burnAmount);
        expect(totalSupply).to.be.greaterThan(await ERC20ForSPLMintable.totalSupply());

        // check from Solana node
        const solanaOwnerTokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(ownerSolanaPublicKey));
        expect(BigInt(solanaOwnerTokenBalance.value.amount)).to.be.greaterThan(solanaOwnerTokenBalanceAfter.value.amount);
        expect(BigInt(solanaOwnerTokenBalance.value.amount)).to.eq(BigInt(solanaOwnerTokenBalanceAfter.value.amount) + burnAmount);
        const solanaTotalSupplyAfter = await connection.getTokenSupply(new PublicKey(solanaProgramAddress));
        expect(BigInt(solanaTotalSupply.value.amount)).to.be.greaterThan(BigInt(solanaTotalSupplyAfter.value.amount));
    });

    it('transfer from user1 to user2', async function () {
        const transferAmount = ethers.parseUnits('5', SPL_DECIMALS);
        let tx = await ERC20ForSPLMintable.connect(user1).transfer(user2.address, transferAmount);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        expect(await ERC20ForSPLMintable.balanceOf(user1.address)).to.eq(INITIAL_USER_BALANCE - transferAmount);
        expect(await ERC20ForSPLMintable.balanceOf(user2.address)).to.eq(INITIAL_USER_BALANCE + transferAmount);

        // check from Solana node
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        expect(solanaUser1TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE - transferAmount);
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));
        expect(solanaUser2TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE + transferAmount);
    });

    it('transfer from user2 to user1', async function () {
        const transferAmount = ethers.parseUnits('5', SPL_DECIMALS);
        let tx = await ERC20ForSPLMintable.connect(user2).transfer(user1.address, transferAmount);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        expect(await ERC20ForSPLMintable.balanceOf(user1.address)).to.eq(INITIAL_USER_BALANCE);
        expect(await ERC20ForSPLMintable.balanceOf(user2.address)).to.eq(INITIAL_USER_BALANCE);

        // check from Solana node
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        expect(solanaUser1TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE);
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));
        expect(solanaUser2TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE);
    });

    it('transfer from user1 to user2 using transferSolana', async function () {
        const user1Balance = await ERC20ForSPLMintable.balanceOf(user1.address);
        const user2Balance = await ERC20ForSPLMintable.balanceOf(user2.address);
        const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));

        const transferAmount = ethers.parseUnits('10', SPL_DECIMALS);
        let tx = await ERC20ForSPLMintable.connect(user1).transferSolana(await ERC20ForSPLMintable.solanaAccount(user2.address), transferAmount);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        const user1BalanceAfter = await ERC20ForSPLMintable.balanceOf(user1.address);
        const user2BalanceAfter = await ERC20ForSPLMintable.balanceOf(user2.address);
        expect(user1Balance).to.be.greaterThan(user1BalanceAfter);
        expect(user2BalanceAfter).to.be.greaterThan(user2Balance);

        // check from Solana node
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));
        expect(BigInt(solanaUser1TokenBalance.value.amount)).to.be.greaterThan(BigInt(solanaUser1TokenBalanceAfter.value.amount));
        expect(BigInt(solanaUser2TokenBalanceAfter.value.amount)).to.be.greaterThan(BigInt(solanaUser2TokenBalance.value.amount));
    });

    it('transfer from user2 to user1 by using transferSolana', async function () {
        const user1Balance = await ERC20ForSPLMintable.balanceOf(user1.address);
        const user2Balance = await ERC20ForSPLMintable.balanceOf(user2.address);
        const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));

        const transferAmount = ethers.parseUnits('20', SPL_DECIMALS);
        let tx = await ERC20ForSPLMintable.connect(user2).transferSolana(await ERC20ForSPLMintable.solanaAccount(user1.address), transferAmount);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        const user1BalanceAfter = await ERC20ForSPLMintable.balanceOf(user1.address);
        const user2BalanceAfter = await ERC20ForSPLMintable.balanceOf(user2.address);
        expect(user1BalanceAfter).to.be.greaterThan(user1Balance);
        expect(user2Balance).to.be.greaterThan(user2BalanceAfter);

        // check from Solana node
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));
        expect(BigInt(solanaUser1TokenBalanceAfter.value.amount)).to.be.greaterThan(BigInt(solanaUser1TokenBalance.value.amount));
        expect(BigInt(solanaUser2TokenBalance.value.amount)).to.be.greaterThan(BigInt(solanaUser2TokenBalanceAfter.value.amount));
    });

    it('approve from user2 to user1', async function () {
        const user2Allowance = await ERC20ForSPLMintable.allowance(user2.address, user1.address);

        let tx = await ERC20ForSPLMintable.connect(user2).approve(user1.address, ethers.parseUnits('1', SPL_DECIMALS));
        await tx.wait(RECEIPTS_COUNT);

        const user2AllowanceAfter = await ERC20ForSPLMintable.allowance(user2.address, user1.address);
        expect(user2AllowanceAfter).to.be.greaterThan(user2Allowance);
    });
    
    it('transferFrom from user2 to user1', async function () {
        const user2Allowance = await ERC20ForSPLMintable.allowance(user2.address, user1.address);
        const user1Balance = await ERC20ForSPLMintable.balanceOf(user1.address);
        const user2Balance = await ERC20ForSPLMintable.balanceOf(user2.address);
        const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));

        let tx = await ERC20ForSPLMintable.connect(user1).transferFrom(user2.address, user1.address, user2Allowance);
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        const user2AllowanceAfter = await ERC20ForSPLMintable.allowance(user2.address, user1.address);
        const user1BalanceAfter = await ERC20ForSPLMintable.balanceOf(user1.address);
        const user2BalanceAfter = await ERC20ForSPLMintable.balanceOf(user2.address);
        expect(user2Allowance).to.be.greaterThan(user2AllowanceAfter);
        expect(user2AllowanceAfter).to.eq(0);
        expect(user1BalanceAfter).to.be.greaterThan(user1Balance);
        expect(user2Balance).to.be.greaterThan(user2BalanceAfter);

        // check from Solana node
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));
        expect(BigInt(solanaUser1TokenBalanceAfter.value.amount)).to.be.greaterThan(BigInt(solanaUser1TokenBalance.value.amount));
        expect(BigInt(solanaUser2TokenBalance.value.amount)).to.be.greaterThan(BigInt(solanaUser2TokenBalanceAfter.value.amount));
    });

    it('approveSolana from user1 to user2 and owner; revoke with approveSolana', async function () {
        let amount = ethers.parseUnits('1', SPL_DECIMALS);
        let tx = await ERC20ForSPLMintable.connect(user1).approveSolana(await ERC20ForSPLMintable.solanaAccount(user2.address), amount);
        await tx.wait(RECEIPTS_COUNT);
        let accountDelegateData = await ERC20ForSPLMintable.getAccountDelegateData(user1.address);
        expect(accountDelegateData[0]).to.eq(await ERC20ForSPLMintable.solanaAccount(user2.address));
        expect(accountDelegateData[1]).to.eq(BigInt(amount));

        let amount1 = ethers.parseUnits('2', SPL_DECIMALS);
        let tx1 = await ERC20ForSPLMintable.connect(user1).approveSolana(await ERC20ForSPLMintable.solanaAccount(owner.address), amount1);
        await tx1.wait(RECEIPTS_COUNT);
        
        let accountDelegateData1 = await ERC20ForSPLMintable.getAccountDelegateData(user1.address);
        expect(accountDelegateData1[0]).to.eq(await ERC20ForSPLMintable.solanaAccount(owner.address));
        expect(accountDelegateData1[1]).to.eq(BigInt(amount1));

        // test revoke approveSolana
        let tx2 = await ERC20ForSPLMintable.connect(user1).approveSolana(await ERC20ForSPLMintable.solanaAccount(owner.address), 0);
        await tx2.wait(RECEIPTS_COUNT);
        
        let accountDelegateData2 = await ERC20ForSPLMintable.getAccountDelegateData(user1.address);
        expect(accountDelegateData2[0]).to.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
        expect(accountDelegateData2[1]).to.eq(0);
    });

    it('Malicious transfer ( supposed to revert )', async function () {
        // user3 has no tokens at all
        await expect(
            ERC20ForSPLMintable.connect(user3).transfer(user1.address, ethers.parseUnits('1', SPL_DECIMALS))
        ).to.be.reverted;
    });

    it('Malicious transferFrom ( supposed to revert )', async function () {
        // user3 has no approval at all
        await expect(
            ERC20ForSPLMintable.connect(user3).transferFrom(user2.address, user3.address, ethers.parseUnits('1', SPL_DECIMALS))
        ).to.be.reverted;
    });

    it('Malicious mint ( supposed to revert )', async function () {
        await expect(
            ERC20ForSPLMintable.connect(user1).mint(user2.address, ethers.parseUnits('1', SPL_DECIMALS))
        ).to.be.reverted;
    });

    it('Malicious burn ( supposed to revert )', async function () {
        // user3 has no tokens at all
        await expect(
            ERC20ForSPLMintable.connect(user3).burn(ethers.parseUnits('1', SPL_DECIMALS))
        ).to.be.reverted;
    });

    it('Malicious uint64 overflow ( supposed to revert )', async function () {
        // 18446744073709551615 is the maximum uint64
        await expect(
            ERC20ForSPLMintable.connect(user1).transfer(user2.address, '18446744073709551616')
        ).to.be.revertedWithCustomError(
            ERC20ForSPLMintable,
            'AmountExceedsUint64'
        );

        await expect(
            ERC20ForSPLMintable.connect(user1).burn('18446744073709551616')
        ).to.be.revertedWithCustomError(
            ERC20ForSPLMintable,
            'AmountExceedsUint64'
        );
    });

    it('Malicious change of owner ( supposed to revert )', async function () {
        await expect(
            ERC20ForSPLMintable.connect(user1).transferOwnership(user1.address)
        ).to.be.reverted;
    });

    it('Malicious contract upgrade ( supposed to revert )', async function () {
        const ERC20ForSPLMintableV2Factory = await ethers.getContractFactory("ERC20ForSPLV2", user1);
        await expect(
            upgrades.upgradeProxy(ERC20ForSPLMintableAddress, ERC20ForSPLMintableV2Factory)
        ).to.be.reverted;
    });

    it('Malicious implementation initialize ( supposed to revert )', async function () {
        const ERC20ForSPLMintableImplementationAddress = await upgrades.erc1967.getImplementationAddress(ERC20ForSPLMintable.target);
        console.log(ERC20ForSPLMintableImplementationAddress, 'ERC20ForSPLMintableImplementationAddress');
        const ERC20ForSPLMintableFactory = await hre.ethers.getContractFactory('ERC20ForSPLMintable');
        const ERC20ForSPLMintableImplementation = await ERC20ForSPLMintableFactory.attach(ERC20ForSPLMintableImplementationAddress);

        await expect(
            ERC20ForSPLMintableImplementation.initialize(
                'FAKECOIN',
                'FAKE',
                9
            )
        ).to.be.reverted;
    });

    it('Test UUPS contract upgrade', async function () {
        const proxyOwner = await ERC20ForSPLMintable.owner();
        const totalSupply = await ERC20ForSPLMintable.totalSupply();
        const ownerBalance = await ERC20ForSPLMintable.balanceOf(owner.address);
        const user1Balance = await ERC20ForSPLMintable.balanceOf(user1.address);
        const user2Balance = await ERC20ForSPLMintable.balanceOf(user2.address);
        const solanaOwnerTokenBalance = await connection.getTokenAccountBalance(new PublicKey(ownerSolanaPublicKey));
        const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));
        const solanaTotalSupply = await connection.getTokenSupply(new PublicKey(solanaProgramAddress));

        const ERC20ForSPLMintableV2Factory = await ethers.getContractFactory("ERC20ForSPLV2");
        const ERC20ForSPLMintableV2 = await upgrades.upgradeProxy(ERC20ForSPLMintableAddress, ERC20ForSPLMintableV2Factory);
        await ERC20ForSPLMintableV2.waitForDeployment();
        console.log("ERC20ForSPLMintableV2 upgraded successfully");

        // just a workout to wait for ERC20ForSPLMintableV2 to be mined onchain, because upgradeProxy doesn't support .wait()
        let tx = await owner.sendTransaction({
            to: owner.address,
            value: 0
        });
        await tx.wait(RECEIPTS_COUNT);

        // check from Neon node
        const dummyDataInV2 = await ERC20ForSPLMintableV2.getDummyData();
        const proxyOwnerAfter = await ERC20ForSPLMintableV2.owner();
        const totalSupplyAfter = await ERC20ForSPLMintableV2.totalSupply();
        const ownerBalanceAfter = await ERC20ForSPLMintableV2.balanceOf(owner.address);
        const user1BalanceAfter = await ERC20ForSPLMintableV2.balanceOf(user1.address);
        const user2BalanceAfter = await ERC20ForSPLMintableV2.balanceOf(user2.address);
        expect(ERC20ForSPLMintableV2.target).to.eq(ERC20ForSPLMintable.target);
        expect(dummyDataInV2).to.eq(12345);
        expect(proxyOwner).to.eq(proxyOwnerAfter);
        expect(totalSupply).to.eq(totalSupplyAfter);
        expect(ownerBalance).to.eq(ownerBalanceAfter);
        expect(user1Balance).to.eq(user1BalanceAfter);
        expect(user2Balance).to.eq(user2BalanceAfter);

        // check from Solana node
        const solanaTotalSupplyAfter = await connection.getTokenSupply(new PublicKey(solanaProgramAddress));
        const solanaOwnerTokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(ownerSolanaPublicKey));
        const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user1SolanaPublicKey));
        const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new PublicKey(user2SolanaPublicKey));
        expect(solanaTotalSupply.value.amount).to.eq(solanaTotalSupplyAfter.value.amount);
        expect(solanaOwnerTokenBalance.value.amount).to.eq(solanaOwnerTokenBalanceAfter.value.amount);
        expect(solanaUser1TokenBalance.value.amount).to.eq(solanaUser1TokenBalanceAfter.value.amount);
        expect(solanaUser2TokenBalance.value.amount).to.eq(solanaUser2TokenBalanceAfter.value.amount);
    });
});