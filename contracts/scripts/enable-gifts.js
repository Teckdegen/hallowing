const hre = require("hardhat");
const { saveDeployment } = require("./deployments");

async function main() {
  const vaultAddress = process.env.VAULT || require("../../deployments.json")[hre.network.name === "robinhood" ? "mainnet" : "testnet"].vault;
  const token = process.env.HALLOW_TOKEN;
  if (!vaultAddress || !token) throw new Error("Set HALLOW_TOKEN, and VAULT if deployments.json has no vault.");
  const vault = await hre.ethers.getContractAt("HallowingVault", vaultAddress);
  if (await vault.giftsEnabled()) {
    console.log("GIFTS ALREADY ON with", await vault.token());
    return;
  }
  await (await vault.enableGifts(token)).wait();
  console.log("GIFTS ON with", token, "decimals", (await vault.tokenDecimals()).toString());
  saveDeployment(hre.network.name, { hallowToken: token });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
