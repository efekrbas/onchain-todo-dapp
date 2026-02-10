const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const TodoApp = await hre.ethers.getContractFactory("TodoApp");
    const todoApp = await TodoApp.deploy();

    await todoApp.waitForDeployment();
    const address = await todoApp.getAddress();

    console.log("TodoApp deployed to:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
