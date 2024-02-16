// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');

async function main() {
    const TOKEN_MINT = '0xa4a420d75f056d9cebb8eda13af07965261cb872b129f99b1ac94525ae8fded3'; // Custom SPLToken on Solana Devnet ( C5h24dhh9PjaVtHmf6CaqXbhi9SgrfwUSQt2MskWRLYr )
    
    // deploy Beacon's implementation
    const ERC20ForSPLContractFactory = await ethers.getContractFactory('ERC20ForSPL');
    const ERC20ForSPL = await ethers.deployContract('ERC20ForSPL');
    await ERC20ForSPL.waitForDeployment();

    console.log(ERC20ForSPL.target, 'Beacon\'s implementation');

    // deploy Factory's implementation
    const ERC20ForSPLFactoryUUPSFactory = await hre.ethers.getContractFactory('ERC20ForSPLFactory');
    const ERC20ForSPLFactoryImpl = await ethers.deployContract('ERC20ForSPLFactory');
    await ERC20ForSPLFactoryImpl.waitForDeployment();
    console.log(ERC20ForSPLFactoryImpl.target, 'Factory\'s UUPS implementation');

    // deploy Factory's UUPS proxy
    const ERC1967Proxy = await ethers.getContractFactory('ERC1967Proxy');
    const ERC20ForSPLFactoryProxy = await ERC1967Proxy.deploy(
        ERC20ForSPLFactoryImpl.target,
        ERC20ForSPLFactoryUUPSFactory.interface.encodeFunctionData('initialize', [ERC20ForSPL.target])
    );
    await ERC20ForSPLFactoryProxy.waitForDeployment(); 

    // create Factory's instance
    const ERC20ForSPLFactoryInstance = ERC20ForSPLFactoryUUPSFactory.attach(ERC20ForSPLFactoryProxy.target);

    console.log(await ethers.provider.getStorage(ERC20ForSPLFactoryInstance.target, 0), 'ERC20ForSPLFactoryInstance - slot0 ( beacon impl )');
    console.log(await ethers.provider.getStorage(ERC20ForSPLFactoryInstance.target, 1), 'ERC20ForSPLFactoryInstance - slot1 ( uups impl )');
    console.log(await ethers.provider.getStorage(ERC20ForSPLFactoryInstance.target, 2), 'ERC20ForSPLFactoryInstance - slot2 ( owner )\n');

    // deploy beacon proxy #1
    const BeaconProxy = await ethers.deployContract('BeaconProxy', [
        ERC20ForSPLFactoryInstance.target,
        ERC20ForSPLContractFactory.interface.encodeFunctionData('initialize', [TOKEN_MINT])
    ]);
    await BeaconProxy.waitForDeployment(); 

    // create BeaconProxy's instance
    const BeaconProxyInstance = ERC20ForSPLContractFactory.attach(BeaconProxy.target);
    console.log(await BeaconProxyInstance.tokenMint(), 'TOKEN_MINT');

    console.log(await ethers.provider.getStorage(BeaconProxyInstance.target, 0), 'BeaconProxy - slot0');
    console.log(await ethers.provider.getStorage(BeaconProxyInstance.target, 1), 'BeaconProxy - slot1');
    console.log(await ethers.provider.getStorage(BeaconProxyInstance.target, 2), 'BeaconProxy - slot2\n');

    // deploy new Beacon's implementation
    const ERC20ForSPLV2ContractFactory = await ethers.getContractFactory('ERC20ForSPLV2');
    const ERC20ForSPLV2 = await ethers.deployContract('ERC20ForSPLV2');
    await ERC20ForSPLV2.waitForDeployment();

    // upgrade to new Beacon's implementation
    let tx = await ERC20ForSPLFactoryInstance.upgradeTo(ERC20ForSPLV2.target);
    await tx.wait(3);

    console.log(await ERC20ForSPLFactoryInstance.implementation(), 'ERC20ForSPLFactoryInstance.implementation()');

    const BeaconProxyInstanceV2 = await upgrades.forceImport(BeaconProxy.target, ERC20ForSPLV2ContractFactory);
    console.log(await BeaconProxyInstanceV2.tokenMint(), 'TOKEN_MINT');
    console.log(await BeaconProxyInstanceV2.getDummyData(), 'getDummyData');

    console.log(await ethers.provider.getStorage(ERC20ForSPLFactoryInstance.target, 0), 'ERC20ForSPLFactoryInstance - slot0 ( beacon impl )');
    console.log(await ethers.provider.getStorage(ERC20ForSPLFactoryInstance.target, 1), 'ERC20ForSPLFactoryInstance - slot1 ( uups impl )');
    console.log(await ethers.provider.getStorage(ERC20ForSPLFactoryInstance.target, 2), 'ERC20ForSPLFactoryInstance - slot2 ( owner )\n');

    // deploy new Factory's UUPS implementation
    const ERC20ForSPLFactoryV2UUPSFactory = await hre.ethers.getContractFactory('ERC20ForSPLFactoryV2');
    const ERC20ForSPLFactoryV2Impl = await ethers.deployContract('ERC20ForSPLFactoryV2');
    await ERC20ForSPLFactoryV2Impl.waitForDeployment();
    console.log(ERC20ForSPLFactoryV2Impl.target, 'Factory\'s UUPS implementation');

    // upgrade to new Factory's UUPS implementation
    tx = await ERC20ForSPLFactoryInstance.upgradeToAndCall(ERC20ForSPLFactoryV2Impl.target, '0x');
    await tx.wait(3);

    const ERC20ForSPLFactoryInstanceV2 = ERC20ForSPLFactoryV2UUPSFactory.attach(ERC20ForSPLFactoryInstance.target);
    console.log(await ERC20ForSPLFactoryInstanceV2.getDummyData(), 'ERC20ForSPLFactoryInstanceV2.getDummyData()');

    console.log(await ethers.provider.getStorage(ERC20ForSPLFactoryInstance.target, 0), 'ERC20ForSPLFactoryInstance - slot0 ( beacon impl )');
    console.log(await ethers.provider.getStorage(ERC20ForSPLFactoryInstance.target, 1), 'ERC20ForSPLFactoryInstance - slot1 ( uups impl )');
    console.log(await ethers.provider.getStorage(ERC20ForSPLFactoryInstance.target, 2), 'ERC20ForSPLFactoryInstance - slot2 ( owner )\n');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});