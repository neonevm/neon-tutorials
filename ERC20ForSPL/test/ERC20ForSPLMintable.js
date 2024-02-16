const { ethers } = require("hardhat");
const { expect } = require("chai");
const web3 = require("@solana/web3.js");
require("dotenv").config();

// define Solana Devnet connection
const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");

describe('Test init', async function () {
    let owner, user1, user2, user3;
    let ERC20ForSPLMintable;
    let ERC20ForSPLMintableFactory;
    let solanaProgramAddress;
    let ownerSolanaPublicKey;
    let user1SolanaPublicKey;
    let user2SolanaPublicKey;
    const TOKEN_MINT_DECIMALS = 9; // never higher than 9 for ERC20ForSPL
    const INITIAL_OWNER_BALANCE = ethers.parseUnits('1000000', TOKEN_MINT_DECIMALS);
    const INITIAL_USER_BALANCE = ethers.parseUnits('150', TOKEN_MINT_DECIMALS);
    const RECEIPTS_COUNT = 10;
    const STORAGE_SLOTS = {
        FACTORY: {
            BEACON_IMPL: 0,
            UUPS_IMP: 1,
            OWNER: 2
        },
        ERC20_FOR_SPL: {
            BEACON_ADDRESS: 0
        }
    };
    const AbiCoder = new ethers.AbiCoder();

    before(async function() {
        [owner, user1, user2, user3] = await ethers.getSigners();
        const ERC20ForSPLMintableFactoryUUPSFactory = await hre.ethers.getContractFactory('ERC20ForSPLMintableFactory');
        const ERC20ForSPLMintableContractFactory = await ethers.getContractFactory('ERC20ForSPLMintable');

        // deploy Beacon's implementation
        const ERC20ForSPLMintableImpl = await ethers.deployContract('ERC20ForSPLMintable');
        await ERC20ForSPLMintableImpl.waitForDeployment();

        // deploy Factory's implementation
        const ERC20ForSPLMintableFactoryImpl = await ethers.deployContract('ERC20ForSPLMintableFactory');
        await ERC20ForSPLMintableFactoryImpl.waitForDeployment();

        // deploy Factory's UUPS proxy
        const ERC1967Proxy = await ethers.getContractFactory('ERC1967Proxy');
        const ERC20ForSPLMintableFactoryProxy = await ERC1967Proxy.deploy(
            ERC20ForSPLMintableFactoryImpl.target,
            ERC20ForSPLMintableFactoryUUPSFactory.interface.encodeFunctionData('initialize', [ERC20ForSPLMintableImpl.target])
        );
        await ERC20ForSPLMintableFactoryProxy.waitForDeployment(); 

        // create Factory's instance
        ERC20ForSPLMintableFactory = ERC20ForSPLMintableFactoryUUPSFactory.attach(ERC20ForSPLMintableFactoryProxy.target);

        let tx = await ERC20ForSPLMintableFactory.deploy(
            'Testcoin',
            'TST',
            9
        );
        await tx.wait(RECEIPTS_COUNT);

        let tokenAddress = await ERC20ForSPLMintableFactory.tokens(0);

        ERC20ForSPLMintable = ERC20ForSPLMintableContractFactory.attach(tokenAddress);
        console.log('\nCreating instance of just now deployed ERC20ForSPLMintable contract with address', "\x1b[32m", ERC20ForSPLMintable.target, "\x1b[30m", '\n'); 

        console.log('ERC20ForSPLMintableFactory\'s BEACON_IMPL SLOT -', await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));
        console.log('ERC20ForSPLMintableFactory\'s UUPS_IMP SLOT -', await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.UUPS_IMP));
        console.log('ERC20ForSPLMintableFactory\'s OWNER SLOT -', await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.OWNER));
        console.log('ERC20ForSPLMintable\'s BEACON_ADDRESS SLOT -', await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.ERC20_FOR_SPL.BEACON_ADDRESS));

        const TokenMintAccount = await ERC20ForSPLMintable.findMintAccount();
        solanaProgramAddress = ethers.encodeBase58(TokenMintAccount);
        ownerSolanaPublicKey = ethers.encodeBase58(await ERC20ForSPLMintable.solanaAccount(owner.address));
        user1SolanaPublicKey = ethers.encodeBase58(await ERC20ForSPLMintable.solanaAccount(user1.address));
        user2SolanaPublicKey = ethers.encodeBase58(await ERC20ForSPLMintable.solanaAccount(user2.address));
        console.log('\nTokenMintAccount -', TokenMintAccount);
        console.log('solanaProgramAddress -', solanaProgramAddress);
        console.log('\nOwner addresses:');
        console.log('Neon EVM address -', owner.address);
        console.log('Solana data account -', ownerSolanaPublicKey);
        console.log('\nUser1 addresses:');
        console.log('Neon EVM address -', user1.address);
        console.log('Solana data account -', user1SolanaPublicKey);
        console.log('\nUser2 addresses:');
        console.log('Neon EVM address -', user2.address);
        console.log('Solana data account -', user2SolanaPublicKey);
    });

    describe('ERC20ForSPLMintable tests', function() {
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
            const solanaOwnerTokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(ownerSolanaPublicKey));
            const user1SolanaTokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            const user2SolanaTokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            expect(solanaOwnerTokenBalance.value.amount).to.eq(INITIAL_OWNER_BALANCE);
            expect(user1SolanaTokenBalance.value.amount).to.eq(INITIAL_USER_BALANCE);
            expect(user2SolanaTokenBalance.value.amount).to.eq(INITIAL_USER_BALANCE);
        });
    
        it('burn from owner', async function () {
            const ownerBalance = await ERC20ForSPLMintable.balanceOf(owner.address);
            const totalSupply = await ERC20ForSPLMintable.totalSupply();
            const solanaOwnerTokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(ownerSolanaPublicKey));
            const solanaTotalSupply = await connection.getTokenSupply(new web3.PublicKey(solanaProgramAddress));
    
            const burnAmount = ethers.parseUnits('10', TOKEN_MINT_DECIMALS);
            let tx = await ERC20ForSPLMintable.connect(owner).burn(burnAmount);
            await tx.wait(RECEIPTS_COUNT);
    
            // check from Neon node
            expect(ownerBalance).to.be.greaterThan(await ERC20ForSPLMintable.balanceOf(owner.address));
            expect(ownerBalance).to.eq(await ERC20ForSPLMintable.balanceOf(owner.address) + burnAmount);
            expect(totalSupply).to.be.greaterThan(await ERC20ForSPLMintable.totalSupply());
    
            // check from Solana node
            const solanaOwnerTokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(ownerSolanaPublicKey));
            expect(BigInt(solanaOwnerTokenBalance.value.amount)).to.be.greaterThan(solanaOwnerTokenBalanceAfter.value.amount);
            expect(BigInt(solanaOwnerTokenBalance.value.amount)).to.eq(BigInt(solanaOwnerTokenBalanceAfter.value.amount) + burnAmount);
            const solanaTotalSupplyAfter = await connection.getTokenSupply(new web3.PublicKey(solanaProgramAddress));
            expect(BigInt(solanaTotalSupply.value.amount)).to.be.greaterThan(BigInt(solanaTotalSupplyAfter.value.amount));
        });
    
        it('transfer from user1 to user2', async function () {
            const transferAmount = ethers.parseUnits('5', TOKEN_MINT_DECIMALS);
            let tx = await ERC20ForSPLMintable.connect(user1).transfer(user2.address, transferAmount);
            await tx.wait(RECEIPTS_COUNT);
    
            // check from Neon node
            expect(await ERC20ForSPLMintable.balanceOf(user1.address)).to.eq(INITIAL_USER_BALANCE - transferAmount);
            expect(await ERC20ForSPLMintable.balanceOf(user2.address)).to.eq(INITIAL_USER_BALANCE + transferAmount);
    
            // check from Solana node
            const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            expect(solanaUser1TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE - transferAmount);
            const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
            expect(solanaUser2TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE + transferAmount);
        });
    
        it('transfer from user2 to user1', async function () {
            const transferAmount = ethers.parseUnits('5', TOKEN_MINT_DECIMALS);
            let tx = await ERC20ForSPLMintable.connect(user2).transfer(user1.address, transferAmount);
            await tx.wait(RECEIPTS_COUNT);
    
            // check from Neon node
            expect(await ERC20ForSPLMintable.balanceOf(user1.address)).to.eq(INITIAL_USER_BALANCE);
            expect(await ERC20ForSPLMintable.balanceOf(user2.address)).to.eq(INITIAL_USER_BALANCE);
    
            // check from Solana node
            const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            expect(solanaUser1TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE);
            const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
            expect(solanaUser2TokenBalanceAfter.value.amount).to.eq(INITIAL_USER_BALANCE);
        });
    
        it('transfer from user1 to user2 using transferSolana', async function () {
            const user1Balance = await ERC20ForSPLMintable.balanceOf(user1.address);
            const user2Balance = await ERC20ForSPLMintable.balanceOf(user2.address);
            const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
    
            const transferAmount = ethers.parseUnits('10', TOKEN_MINT_DECIMALS);
            let tx = await ERC20ForSPLMintable.connect(user1).transferSolana(await ERC20ForSPLMintable.solanaAccount(user2.address), transferAmount);
            await tx.wait(RECEIPTS_COUNT);
    
            // check from Neon node
            const user1BalanceAfter = await ERC20ForSPLMintable.balanceOf(user1.address);
            const user2BalanceAfter = await ERC20ForSPLMintable.balanceOf(user2.address);
            expect(user1Balance).to.be.greaterThan(user1BalanceAfter);
            expect(user2BalanceAfter).to.be.greaterThan(user2Balance);
    
            // check from Solana node
            const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
            expect(BigInt(solanaUser1TokenBalance.value.amount)).to.be.greaterThan(BigInt(solanaUser1TokenBalanceAfter.value.amount));
            expect(BigInt(solanaUser2TokenBalanceAfter.value.amount)).to.be.greaterThan(BigInt(solanaUser2TokenBalance.value.amount));
        });
    
        it('transfer from user2 to user1 by using transferSolana', async function () {
            const user1Balance = await ERC20ForSPLMintable.balanceOf(user1.address);
            const user2Balance = await ERC20ForSPLMintable.balanceOf(user2.address);
            const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
    
            const transferAmount = ethers.parseUnits('20', TOKEN_MINT_DECIMALS);
            let tx = await ERC20ForSPLMintable.connect(user2).transferSolana(await ERC20ForSPLMintable.solanaAccount(user1.address), transferAmount);
            await tx.wait(RECEIPTS_COUNT);
    
            // check from Neon node
            const user1BalanceAfter = await ERC20ForSPLMintable.balanceOf(user1.address);
            const user2BalanceAfter = await ERC20ForSPLMintable.balanceOf(user2.address);
            expect(user1BalanceAfter).to.be.greaterThan(user1Balance);
            expect(user2Balance).to.be.greaterThan(user2BalanceAfter);
    
            // check from Solana node
            const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
            expect(BigInt(solanaUser1TokenBalanceAfter.value.amount)).to.be.greaterThan(BigInt(solanaUser1TokenBalance.value.amount));
            expect(BigInt(solanaUser2TokenBalance.value.amount)).to.be.greaterThan(BigInt(solanaUser2TokenBalanceAfter.value.amount));
        });
    
        it('approve from user2 to user1', async function () {
            const user2Allowance = await ERC20ForSPLMintable.allowance(user2.address, user1.address);
    
            let tx = await ERC20ForSPLMintable.connect(user2).approve(user1.address, ethers.parseUnits('1', TOKEN_MINT_DECIMALS));
            await tx.wait(RECEIPTS_COUNT);
    
            const user2AllowanceAfter = await ERC20ForSPLMintable.allowance(user2.address, user1.address);
            expect(user2AllowanceAfter).to.be.greaterThan(user2Allowance);
        });
        
        it('transferFrom from user2 to user1', async function () {
            const user2Allowance = await ERC20ForSPLMintable.allowance(user2.address, user1.address);
            const user1Balance = await ERC20ForSPLMintable.balanceOf(user1.address);
            const user2Balance = await ERC20ForSPLMintable.balanceOf(user2.address);
            const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
    
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
            const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
            expect(BigInt(solanaUser1TokenBalanceAfter.value.amount)).to.be.greaterThan(BigInt(solanaUser1TokenBalance.value.amount));
            expect(BigInt(solanaUser2TokenBalance.value.amount)).to.be.greaterThan(BigInt(solanaUser2TokenBalanceAfter.value.amount));
        });
    
        it('approveSolana from user1 to user2 and owner; revoke with approveSolana', async function () {
            let amount = ethers.parseUnits('1', TOKEN_MINT_DECIMALS);
            let tx = await ERC20ForSPLMintable.connect(user1).approveSolana(await ERC20ForSPLMintable.solanaAccount(user2.address), amount);
            await tx.wait(RECEIPTS_COUNT);
            let accountDelegateData = await ERC20ForSPLMintable.getAccountDelegateData(user1.address);
            expect(accountDelegateData[0]).to.eq(await ERC20ForSPLMintable.solanaAccount(user2.address));
            expect(accountDelegateData[1]).to.eq(BigInt(amount));
    
            let amount1 = ethers.parseUnits('2', TOKEN_MINT_DECIMALS);
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
                ERC20ForSPLMintable.connect(user3).transfer(user1.address, ethers.parseUnits('1', TOKEN_MINT_DECIMALS))
            ).to.be.reverted;
        });
    
        it('Malicious transferFrom ( supposed to revert )', async function () {
            // user3 has no approval at all
            await expect(
                ERC20ForSPLMintable.connect(user3).transferFrom(user2.address, user3.address, ethers.parseUnits('1', TOKEN_MINT_DECIMALS))
            ).to.be.reverted;
        });
    
        it('Malicious mint ( supposed to revert )', async function () {
            await expect(
                ERC20ForSPLMintable.connect(user1).mint(user2.address, ethers.parseUnits('1', TOKEN_MINT_DECIMALS))
            ).to.be.reverted;
        });
    
        it('Malicious burn ( supposed to revert )', async function () {
            // user3 has no tokens at all
            await expect(
                ERC20ForSPLMintable.connect(user3).burn(ethers.parseUnits('1', TOKEN_MINT_DECIMALS))
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

        it('Malicious Beacon implementation upgrade ( supposed to revert )', async function () {
            // deploy new Beacon's implementation
            const ERC20ForSPLMintableV2Impl = await ethers.deployContract('ERC20ForSPLMintableV2');
            await ERC20ForSPLMintableV2Impl.waitForDeployment();
            
            // user1 is not allowed to upgrade the factory's beacon implementation
            await expect(
                ERC20ForSPLMintableFactory.connect(user1).upgradeTo(ERC20ForSPLMintableV2Impl.target)
            ).to.be.reverted;
        });

        it('Malicious Beacon implementation initialize ( supposed to revert )', async function () {
            const ERC20ForSPLMintableContractFactory = await ethers.getContractFactory('ERC20ForSPLMintable');
            const ERC20ForSPLMintableImplAddress = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.UUPS_IMP));
            const ERC20ForSPLMintableImplementation = await ERC20ForSPLMintableContractFactory.attach(ERC20ForSPLMintableImplAddress[0]);

            await expect(
                ERC20ForSPLMintableImplementation.initialize(
                    'Testcoin',
                    'TST',
                    9,
                    ethers.Wallet.createRandom()
                )
            ).to.be.reverted;
        });

        it('Test Beacon implementation upgrade', async function () {
            const totalSupply = await ERC20ForSPLMintable.totalSupply();
            const ownerBalance = await ERC20ForSPLMintable.balanceOf(owner.address);
            const user1Balance = await ERC20ForSPLMintable.balanceOf(user1.address);
            const user2Balance = await ERC20ForSPLMintable.balanceOf(user2.address);
            const solanaOwnerTokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(ownerSolanaPublicKey));
            const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
            const solanaTotalSupply = await connection.getTokenSupply(new web3.PublicKey(solanaProgramAddress));
            const factoryBeaconImplementationSlot = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));

            // deploy second dummy BeaconProxy
            let tx = await ERC20ForSPLMintableFactory.deploy(
                'Testcoin#2',
                'TST#2',
                6
            );
            await tx.wait(RECEIPTS_COUNT);

            let tokenAddress = await ERC20ForSPLMintableFactory.tokens(1);

            // deploy new Beacon's implementation
            const ERC20ForSPLMintableV2Impl = await ethers.deployContract('ERC20ForSPLMintableV2');
            await ERC20ForSPLMintableV2Impl.waitForDeployment();

            tx = await ERC20ForSPLMintableFactory.upgradeTo(ERC20ForSPLMintableV2Impl.target);
            await tx.wait(RECEIPTS_COUNT);

            const ERC20ForSPLMintableV2 = ERC20ForSPLMintableV2Impl.attach(ERC20ForSPLMintable.target);
            const ERC20ForSPLMintableSecondInstanceV2 = ERC20ForSPLMintableV2Impl.attach(tokenAddress);

            // check from Neon node
            expect(ERC20ForSPLMintableV2.target).to.eq(ERC20ForSPLMintable.target);
            expect(totalSupply).to.eq(await ERC20ForSPLMintableV2.totalSupply());
            expect(ownerBalance).to.eq(await ERC20ForSPLMintableV2.balanceOf(owner.address));
            expect(user1Balance).to.eq(await ERC20ForSPLMintableV2.balanceOf(user1.address));
            expect(user2Balance).to.eq(await ERC20ForSPLMintableV2.balanceOf(user2.address));
            expect(await ERC20ForSPLMintableV2.getDummyData()).to.eq(1112131415); // make sure both Beacon Proxies got their implementations updated
            expect(await ERC20ForSPLMintableSecondInstanceV2.getDummyData()).to.eq(1112131415); // make sure both Beacon Proxies got their implementations updated

            // check from Solana node
            const solanaTotalSupplyAfter = await connection.getTokenSupply(new web3.PublicKey(solanaProgramAddress));
            const solanaOwnerTokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(ownerSolanaPublicKey));
            const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
            const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
            expect(solanaTotalSupply.value.amount).to.eq(solanaTotalSupplyAfter.value.amount);
            expect(solanaOwnerTokenBalance.value.amount).to.eq(solanaOwnerTokenBalanceAfter.value.amount);
            expect(solanaUser1TokenBalance.value.amount).to.eq(solanaUser1TokenBalanceAfter.value.amount);
            expect(solanaUser2TokenBalance.value.amount).to.eq(solanaUser2TokenBalanceAfter.value.amount);

            // validate storage slots
            const factoryBeaconImplementationSlotAfterUpgrade = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));
            expect(factoryBeaconImplementationSlot[0]).to.not.eq(factoryBeaconImplementationSlotAfterUpgrade[0]);
        });
    });

    describe('ERC20ForSPLMintableFactory tests', function() {
        it('Malicious change of owner ( supposed to revert )', async function () {
            await expect(
                ERC20ForSPLMintableFactory.connect(user1).transferOwnership(user1.address)
            ).to.be.reverted;
        });

        it('Malicious contract upgrade ( supposed to revert )', async function () {
            // deploy new Factory's UUPS implementation
            const ERC20ForSPLMintableFactoryV2Impl = await ethers.deployContract('ERC20ForSPLMintableFactoryV2');
            await ERC20ForSPLMintableFactoryV2Impl.waitForDeployment();
            console.log(ERC20ForSPLMintableFactoryV2Impl.target, 'Factory\'s V2 UUPS implementation');
            
            // user1 is not allowed to upgrade the factory's UUPS implementation
            await expect(
                ERC20ForSPLMintableFactory.connect(user1).upgradeToAndCall(ERC20ForSPLMintableFactoryV2Impl.target, '0x')
            ).to.be.reverted;
        });

        it('Malicious UUPS implementation initialize ( supposed to revert )', async function () {
            const ERC20ForSPLMintableFactoryUUPSFactory = await hre.ethers.getContractFactory('ERC20ForSPLMintableFactory');
            const ERC20ForSPLMintableFactoryImplAddress = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));
            const ERC20ForSPLMintableFactoryImplementation = await ERC20ForSPLMintableFactoryUUPSFactory.attach(ERC20ForSPLMintableFactoryImplAddress[0]);
            await expect(
                ERC20ForSPLMintableFactoryImplementation.initialize(ethers.Wallet.createRandom())
            ).to.be.reverted;
        });

        it('Test UUPS contract upgrade', async function () {
            const factoryOwner = await ERC20ForSPLMintableFactory.owner();
            const factoryBeacon = await ERC20ForSPLMintableFactory.beacon();
            const factoryBeaconImplementation = await ERC20ForSPLMintableFactory.implementation();
            const factoryBeaconImplementationSlot = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));
            const factoryUUPSImplementationSlot = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.UUPS_IMP));
            const factoryOwnerImplementationSlot = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.OWNER));

            // deploy new Factory's UUPS implementation
            const ERC20ForSPLMintableFactoryV2UUPSFactory = await hre.ethers.getContractFactory('ERC20ForSPLMintableFactoryV2');
            const ERC20ForSPLMintableFactoryV2Impl = await ethers.deployContract('ERC20ForSPLMintableFactoryV2');
            await ERC20ForSPLMintableFactoryV2Impl.waitForDeployment();
            console.log(ERC20ForSPLMintableFactoryV2Impl.target, 'Factory\'s V2 UUPS implementation');

            // upgrade to new Factory's UUPS implementation
            let tx = await ERC20ForSPLMintableFactory.upgradeToAndCall(ERC20ForSPLMintableFactoryV2Impl.target, '0x');
            await tx.wait(RECEIPTS_COUNT);

            const ERC20ForSPLMintableFactoryV2 = ERC20ForSPLMintableFactoryV2UUPSFactory.attach(ERC20ForSPLMintableFactory.target);

            expect(ERC20ForSPLMintableFactoryV2.target).to.eq(ERC20ForSPLMintableFactory.target);
            expect(factoryOwner).to.eq(await ERC20ForSPLMintableFactoryV2.owner());
            expect(factoryBeacon).to.eq(await ERC20ForSPLMintableFactoryV2.beacon());
            expect(factoryBeaconImplementation).to.eq(await ERC20ForSPLMintableFactoryV2.implementation());
            expect(await ERC20ForSPLMintableFactoryV2.getDummyData()).to.eq(1617181920);

            // validate storage slots
            const factoryBeaconImplementationSlotAfterUpgrade = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));
            const factoryUUPSImplementationSlotAfterUpgrade = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.UUPS_IMP));
            const factoryOwnerImplementationSlotAfterUpgrade = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLMintableFactory.target, STORAGE_SLOTS.FACTORY.OWNER));
            expect(factoryBeaconImplementationSlot[0]).to.eq(factoryBeaconImplementationSlotAfterUpgrade[0]);
            expect(factoryUUPSImplementationSlot[0]).to.not.eq(factoryUUPSImplementationSlotAfterUpgrade[0]); // only this one should be updated
            expect(factoryOwnerImplementationSlot[0]).to.eq(factoryOwnerImplementationSlotAfterUpgrade[0]);
        });
    });
});