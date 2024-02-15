const { ethers } = require("hardhat");
const { expect } = require("chai");
const web3 = require("@solana/web3.js");
require("dotenv").config();

// define Solana Devnet connection
const connection = new web3.Connection("https://api.devnet.solana.com", "confirmed");

describe('Test init', async function () {
    let owner, user1, user2, user3;
    let ERC20ForSPLAddress = ''; // PLACE HERE ERC20ForSPL address on Neon EVM
    let ERC20ForSPL;
    let ERC20ForSPLFactory;
    let solanaProgramAddress;
    let ownerSolanaPublicKey;
    let user1SolanaPublicKey;
    let user2SolanaPublicKey;
    let grantedTestersWithBalance;
    const TOKEN_MINT = '0xa4a420d75f056d9cebb8eda13af07965261cb872b129f99b1ac94525ae8fded3'; // Custom SPLToken on Solana Devnet ( C5h24dhh9PjaVtHmf6CaqXbhi9SgrfwUSQt2MskWRLYr )
    const TOKEN_MINT_DECIMALS = 6;
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
        const ERC20ForSPLFactoryUUPSFactory = await hre.ethers.getContractFactory('ERC20ForSPLFactory');
        const ERC20ForSPLContractFactory = await ethers.getContractFactory('ERC20ForSPL');

        if (ethers.isAddress(ERC20ForSPLAddress)) {
            console.log('\nCreating instance of already deployed ERC20ForSPL contract with address', "\x1b[32m", ERC20ForSPLAddress, "\x1b[30m", '\n');
            ERC20ForSPL = ERC20ForSPLContractFactory.attach(ERC20ForSPLAddress);
            ERC20ForSPLFactory = ERC20ForSPLFactoryUUPSFactory.attach(await ERC20ForSPL.beacon());
        } else {
            // deploy Beacon's implementation
            const ERC20ForSPLImpl = await ethers.deployContract('ERC20ForSPL');
            await ERC20ForSPLImpl.waitForDeployment();

            // deploy Factory's implementation
            const ERC20ForSPLFactoryImpl = await ethers.deployContract('ERC20ForSPLFactory');
            await ERC20ForSPLFactoryImpl.waitForDeployment();

            // deploy Factory's UUPS proxy
            const ERC1967Proxy = await ethers.getContractFactory('ERC1967Proxy');
            const ERC20ForSPLFactoryProxy = await ERC1967Proxy.deploy(
                ERC20ForSPLFactoryImpl.target,
                ERC20ForSPLFactoryUUPSFactory.interface.encodeFunctionData('initialize', [ERC20ForSPLImpl.target])
            );
            await ERC20ForSPLFactoryProxy.waitForDeployment(); 

            // create Factory's instance
            ERC20ForSPLFactory = ERC20ForSPLFactoryUUPSFactory.attach(ERC20ForSPLFactoryProxy.target);

            let tx = await ERC20ForSPLFactory.addAlreadyExistingERC20ForSPL(
                [
                    '0x069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f00000000001'
                ],
                [
                    '0xc7Fc9b46e479c5Cb42f6C458D1881e55E6B7986c'
                ]
            );
            await tx.wait(RECEIPTS_COUNT);

            tx = await ERC20ForSPLFactory.deploy(TOKEN_MINT);
            await tx.wait(RECEIPTS_COUNT);

            let tokensData = await ERC20ForSPLFactory.tokensData(TOKEN_MINT);

            ERC20ForSPL = ERC20ForSPLContractFactory.attach(tokensData[0]);
            ERC20ForSPLAddress = ERC20ForSPL.target;
            console.log('\nCreating instance of just now deployed ERC20ForSPL contract with address', "\x1b[32m", ERC20ForSPL.target, "\x1b[30m", '\n'); 
        }

        console.log('ERC20ForSPLFactory\'s BEACON_IMPL SLOT -', await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));
        console.log('ERC20ForSPLFactory\'s UUPS_IMP SLOT -', await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.UUPS_IMP));
        console.log('ERC20ForSPLFactory\'s OWNER SLOT -', await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.OWNER));
        console.log('ERC20ForSPL\'s BEACON_ADDRESS SLOT -', await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.ERC20_FOR_SPL.BEACON_ADDRESS));
        
        const TokenMintAccount = await ERC20ForSPL.tokenMint();
        solanaProgramAddress = ethers.encodeBase58(TokenMintAccount);
        ownerSolanaPublicKey = ethers.encodeBase58(await ERC20ForSPL.solanaAccount(owner.address));
        user1SolanaPublicKey = ethers.encodeBase58(await ERC20ForSPL.solanaAccount(user1.address));
        user2SolanaPublicKey = ethers.encodeBase58(await ERC20ForSPL.solanaAccount(user2.address));
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

        grantedTestersWithBalance = await ERC20ForSPL.balanceOf(owner.address) != 0 && await ERC20ForSPL.balanceOf(user1.address) != 0 && await ERC20ForSPL.balanceOf(user2.address) != 0;
    });

    describe('ERC20ForSPL tests', function() {
        it('validate totalSupply is equal', async function () {
            const tokenSupplyOnSolana = await connection.getTokenSupply(new web3.PublicKey(solanaProgramAddress));
            expect(await ERC20ForSPL.totalSupply()).to.eq(tokenSupplyOnSolana.value.amount);
        });

        it('validate decimals are equal', async function () {
            const mintDataOnSolana = await connection.getParsedAccountInfo(new web3.PublicKey(solanaProgramAddress));
            expect(await ERC20ForSPL.decimals()).to.eq(mintDataOnSolana.value.data.parsed.info.decimals);
        });

        it('burn from owner', async function () {
            if (grantedTestersWithBalance) {
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
            } else {
                this.skip();
            }
        });

        it('transfer from user1 to user2', async function () {
            if (grantedTestersWithBalance) {
                const user1InitialBalance = await ERC20ForSPL.balanceOf(user1.address);
                const user2InitialBalance = await ERC20ForSPL.balanceOf(user2.address);
                const transferAmount = ethers.parseUnits('5', TOKEN_MINT_DECIMALS);
                let tx = await ERC20ForSPL.connect(user1).transfer(user2.address, transferAmount);
                await tx.wait(RECEIPTS_COUNT);

                // check from Neon node
                expect(await ERC20ForSPL.balanceOf(user1.address)).to.eq(user1InitialBalance - transferAmount);
                expect(await ERC20ForSPL.balanceOf(user2.address)).to.eq(user2InitialBalance + transferAmount);

                // check from Solana node
                const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
                expect(solanaUser1TokenBalanceAfter.value.amount).to.eq(user1InitialBalance - transferAmount);
                const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
                expect(solanaUser2TokenBalanceAfter.value.amount).to.eq(user2InitialBalance + transferAmount);
            } else {
                this.skip();
            }
        });

        it('transfer from user2 to user1', async function () {
            if (grantedTestersWithBalance) {
                const user1InitialBalance = await ERC20ForSPL.balanceOf(user1.address);
                const user2InitialBalance = await ERC20ForSPL.balanceOf(user2.address);

                const transferAmount = ethers.parseUnits('5', TOKEN_MINT_DECIMALS);
                let tx = await ERC20ForSPL.connect(user2).transfer(user1.address, transferAmount);
                await tx.wait(RECEIPTS_COUNT);

                // check from Neon node
                expect(await ERC20ForSPL.balanceOf(user1.address)).to.greaterThan(user1InitialBalance);
                expect(await ERC20ForSPL.balanceOf(user2.address)).to.lessThan(user2InitialBalance);

                // check from Solana node
                const solanaUser1TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
                expect(solanaUser1TokenBalanceAfter.value.amount).to.greaterThan(user1InitialBalance);
                const solanaUser2TokenBalanceAfter = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
                expect(solanaUser2TokenBalanceAfter.value.amount).to.lessThan(user2InitialBalance);
            } else {
                this.skip();
            }
        });

        it('transfer from user1 to user2 using transferSolana', async function () {
            if (grantedTestersWithBalance) {
                const user1Balance = await ERC20ForSPL.balanceOf(user1.address);
                const user2Balance = await ERC20ForSPL.balanceOf(user2.address);
                const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
                const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));

                const transferAmount = ethers.parseUnits('5', TOKEN_MINT_DECIMALS);
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
            } else {
                this.skip();
            }
        });

        it('transfer from user2 to user1 by using transferSolana', async function () {
            if (grantedTestersWithBalance) {
                const user1Balance = await ERC20ForSPL.balanceOf(user1.address);
                const user2Balance = await ERC20ForSPL.balanceOf(user2.address);
                const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
                const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));

                const transferAmount = ethers.parseUnits('5', TOKEN_MINT_DECIMALS);
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
            } else {
                this.skip();
            }
        });

        it('approve from user2 to user1', async function () {
            if (grantedTestersWithBalance) {
                const user2Allowance = await ERC20ForSPL.allowance(user2.address, user1.address);

                let tx = await ERC20ForSPL.connect(user2).approve(user1.address, ethers.parseUnits('1', TOKEN_MINT_DECIMALS));
                await tx.wait(RECEIPTS_COUNT);

                const user2AllowanceAfter = await ERC20ForSPL.allowance(user2.address, user1.address);
                expect(user2AllowanceAfter).to.be.greaterThan(user2Allowance);
            } else {
                this.skip();
            }
        });
        
        it('transferFrom from user2 to user1', async function () {
            if (grantedTestersWithBalance) {
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
            } else {
                this.skip();
            }
        });

        it('approveSolana from user1 to user2 and owner; revoke with approveSolana', async function () {
            if (grantedTestersWithBalance) {
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
            } else {
                this.skip();
            }
        });

        it('Malicious transfer ( supposed to revert )', async function () {
            if (grantedTestersWithBalance) {
                // user3 has no tokens at all
                await expect(
                    ERC20ForSPL.connect(user3).transfer(user1.address, ethers.parseUnits('1', TOKEN_MINT_DECIMALS))
                ).to.be.reverted;
            } else {
                this.skip();
            }
        });

        it('Malicious transferFrom ( supposed to revert )', async function () {
            if (grantedTestersWithBalance) {
                // user3 has no approval at all
                await expect(
                    ERC20ForSPL.connect(user3).transferFrom(user2.address, user3.address, ethers.parseUnits('1', TOKEN_MINT_DECIMALS))
                ).to.be.reverted;
            } else {
                this.skip();
            }
        });

        it('Malicious burn ( supposed to revert )', async function () {
            if (grantedTestersWithBalance) {
                // user3 has no tokens at all
                await expect(
                    ERC20ForSPL.connect(user3).burn(ethers.parseUnits('1', TOKEN_MINT_DECIMALS))
                ).to.be.reverted;
            } else {
                this.skip();
            }
        });

        it('Malicious uint64 overflow ( supposed to revert )', async function () {
            if (grantedTestersWithBalance) {
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
            } else {
                this.skip();
            }
        });

        it('Malicious Beacon implementation upgrade ( supposed to revert )', async function () {
            // deploy new Beacon's implementation
            const ERC20ForSPLV2Impl = await ethers.deployContract('ERC20ForSPLV2');
            await ERC20ForSPLV2Impl.waitForDeployment();
            
            // user1 is not allowed to upgrade the factory's beacon implementation
            await expect(
                ERC20ForSPLFactory.connect(user1).upgradeTo(ERC20ForSPLV2Impl.target)
            ).to.be.reverted;
        });

        it('Malicious Beacon implementation initialize ( supposed to revert )', async function () {
            const ERC20ForSPLContractFactory = await ethers.getContractFactory('ERC20ForSPL');
            const ERC20ForSPLImplAddress = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.UUPS_IMP));
            const ERC20ForSPLImplementation = await ERC20ForSPLContractFactory.attach(ERC20ForSPLImplAddress[0]);

            await expect(
                ERC20ForSPLImplementation.initialize('0x0000000000000000000000000000000000000000000000000000000000000000')
            ).to.be.reverted;
        });

        it('Test Beacon implementation upgrade', async function () {
            if (grantedTestersWithBalance) {
                const totalSupply = await ERC20ForSPL.totalSupply();
                const ownerBalance = await ERC20ForSPL.balanceOf(owner.address);
                const user1Balance = await ERC20ForSPL.balanceOf(user1.address);
                const user2Balance = await ERC20ForSPL.balanceOf(user2.address);
                const solanaOwnerTokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(ownerSolanaPublicKey));
                const solanaUser1TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user1SolanaPublicKey));
                const solanaUser2TokenBalance = await connection.getTokenAccountBalance(new web3.PublicKey(user2SolanaPublicKey));
                const solanaTotalSupply = await connection.getTokenSupply(new web3.PublicKey(solanaProgramAddress));
                const factoryBeaconImplementationSlot = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));

                // deploy second dummy BeaconProxy
                let USDT_TOKEN_MINT = '0x2b8a2abbc2878a0f97c79bbfcbf37a7e6ae3253c3a6287783812e4e359dfab4a'; // USDT on Solana devnet
                let tokensData = await ERC20ForSPLFactory.tokensData(USDT_TOKEN_MINT);
                if (tokensData[0] == ethers.ZeroAddress) {
                    let tx = await ERC20ForSPLFactory.deploy(USDT_TOKEN_MINT);
                    await tx.wait(RECEIPTS_COUNT);

                    tokensData = await ERC20ForSPLFactory.tokensData(USDT_TOKEN_MINT);
                }

                // deploy new Beacon's implementation
                const ERC20ForSPLV2Impl = await ethers.deployContract('ERC20ForSPLV2');
                await ERC20ForSPLV2Impl.waitForDeployment();

                tx = await ERC20ForSPLFactory.upgradeTo(ERC20ForSPLV2Impl.target);
                await tx.wait(RECEIPTS_COUNT);

                const ERC20ForSPLV2 = ERC20ForSPLV2Impl.attach(ERC20ForSPL.target);
                const ERC20ForSPLSecondInstanceV2 = ERC20ForSPLV2Impl.attach(tokensData[0]);

                // check from Neon node
                expect(ERC20ForSPLV2.target).to.eq(ERC20ForSPL.target);
                expect(totalSupply).to.eq(await ERC20ForSPLV2.totalSupply());
                expect(ownerBalance).to.eq(await ERC20ForSPLV2.balanceOf(owner.address));
                expect(user1Balance).to.eq(await ERC20ForSPLV2.balanceOf(user1.address));
                expect(user2Balance).to.eq(await ERC20ForSPLV2.balanceOf(user2.address));
                expect(await ERC20ForSPLV2.getDummyData()).to.eq(12345); // make sure both Beacon Proxies got their implementations updated
                expect(await ERC20ForSPLSecondInstanceV2.getDummyData()).to.eq(12345); // make sure both Beacon Proxies got their implementations updated

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
                const factoryBeaconImplementationSlotAfterUpgrade = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));
                expect(factoryBeaconImplementationSlot[0]).to.not.eq(factoryBeaconImplementationSlotAfterUpgrade[0]);
            } else {
                this.skip();
            }
        });
    });

    describe('ERC20ForSPLFactory tests', function() {
        it('Deploying ERC20ForSPL for already existing TOKEN_MINT ( supposed to revert )', async function () {
            // trying to add again wSOL even if it's already existing
            await expect(
                ERC20ForSPLFactory.addAlreadyExistingERC20ForSPL(
                    ['0x069b8857feab8184fb687f634618c035dac439dc1aeb3b5598a0f00000000001'],
                    ['0xc7Fc9b46e479c5Cb42f6C458D1881e55E6B7986c']
                )
            ).to.be.revertedWithCustomError(
                ERC20ForSPLFactory,
                'AlreadyExistingERC20ForSPL'
            );
        });

        it('Malicious call to method addAlreadyExistingERC20ForSPL ( supposed to revert )', async function () {
            // trying to add again wSOL even if it's already existing
            await expect(
                ERC20ForSPLFactory.connect(user1).addAlreadyExistingERC20ForSPL(
                    ['0xd0d6b2043fb14bea672e7e74fa09ce4a42e384bdc302e6d1d854127039afe07a'],
                    ['0x512E48836Cd42F3eB6f50CEd9ffD81E0a7F15103']
                )
            ).to.be.reverted;
        });

        it('Malicious change of owner ( supposed to revert )', async function () {
            await expect(
                ERC20ForSPLFactory.connect(user1).transferOwnership(user1.address)
            ).to.be.reverted;
        });

        it('Malicious contract upgrade ( supposed to revert )', async function () {
            // deploy new Factory's UUPS implementation
            const ERC20ForSPLFactoryV2Impl = await ethers.deployContract('ERC20ForSPLFactoryV2');
            await ERC20ForSPLFactoryV2Impl.waitForDeployment();
            console.log(ERC20ForSPLFactoryV2Impl.target, 'Factory\'s V2 UUPS implementation');
            
            // user1 is not allowed to upgrade the factory's UUPS implementation
            await expect(
                ERC20ForSPLFactory.connect(user1).upgradeToAndCall(ERC20ForSPLFactoryV2Impl.target, '0x')
            ).to.be.reverted;
        });

        it('Malicious UUPS implementation initialize ( supposed to revert )', async function () {
            const ERC20ForSPLFactoryUUPSFactory = await hre.ethers.getContractFactory('ERC20ForSPLFactory');
            const ERC20ForSPLFactoryImplAddress = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));
            const ERC20ForSPLFactoryImplementation = await ERC20ForSPLFactoryUUPSFactory.attach(ERC20ForSPLFactoryImplAddress[0]);
            await expect(
                ERC20ForSPLFactoryImplementation.initialize(ethers.Wallet.createRandom())
            ).to.be.reverted;
        });

        it('Test UUPS contract upgrade', async function () {
            const factoryOwner = await ERC20ForSPLFactory.owner();
            const factoryBeacon = await ERC20ForSPLFactory.beacon();
            const factoryBeaconImplementation = await ERC20ForSPLFactory.implementation();
            const factoryBeaconImplementationSlot = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));
            const factoryUUPSImplementationSlot = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.UUPS_IMP));
            const factoryOwnerImplementationSlot = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.OWNER));

            // deploy new Factory's UUPS implementation
            const ERC20ForSPLFactoryV2UUPSFactory = await hre.ethers.getContractFactory('ERC20ForSPLFactoryV2');
            const ERC20ForSPLFactoryV2Impl = await ethers.deployContract('ERC20ForSPLFactoryV2');
            await ERC20ForSPLFactoryV2Impl.waitForDeployment();
            console.log(ERC20ForSPLFactoryV2Impl.target, 'Factory\'s V2 UUPS implementation');

            // upgrade to new Factory's UUPS implementation
            let tx = await ERC20ForSPLFactory.upgradeToAndCall(ERC20ForSPLFactoryV2Impl.target, '0x');
            await tx.wait(RECEIPTS_COUNT);

            const ERC20ForSPLFactoryV2 = ERC20ForSPLFactoryV2UUPSFactory.attach(ERC20ForSPLFactory.target);

            expect(ERC20ForSPLFactoryV2.target).to.eq(ERC20ForSPLFactory.target);
            expect(factoryOwner).to.eq(await ERC20ForSPLFactoryV2.owner());
            expect(factoryBeacon).to.eq(await ERC20ForSPLFactoryV2.beacon());
            expect(factoryBeaconImplementation).to.eq(await ERC20ForSPLFactoryV2.implementation());
            expect(await ERC20ForSPLFactoryV2.getDummyData()).to.eq(678910);

            // validate storage slots
            const factoryBeaconImplementationSlotAfterUpgrade = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.BEACON_IMPL));
            const factoryUUPSImplementationSlotAfterUpgrade = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.UUPS_IMP));
            const factoryOwnerImplementationSlotAfterUpgrade = AbiCoder.decode(['address'], await ethers.provider.getStorage(ERC20ForSPLFactory.target, STORAGE_SLOTS.FACTORY.OWNER));
            expect(factoryBeaconImplementationSlot[0]).to.eq(factoryBeaconImplementationSlotAfterUpgrade[0]);
            expect(factoryUUPSImplementationSlot[0]).to.not.eq(factoryUUPSImplementationSlotAfterUpgrade[0]); // only this one should be updated
            expect(factoryOwnerImplementationSlot[0]).to.eq(factoryOwnerImplementationSlotAfterUpgrade[0]);
        });
    });
});