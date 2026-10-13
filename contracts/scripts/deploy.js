const hre = require("hardhat");
const { GIFT_PRICES } = require("./gifts");
const { saveDeployment } = require("./deployments");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const endsAt = BigInt(process.env.ENDS_AT || Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60);
  const periodId = BigInt(process.env.PERIOD_ID || 1);

  const vaultFactory = await hre.ethers.getContractFactory("HallowingVault");
  const vault = await vaultFactory.deploy(signer.address, endsAt, periodId, GIFT_PRICES);
  const receipt = await vault.deploymentTransaction().wait();
  const address = await vault.getAddress();
  console.log("VAULT", address);
  console.log("VAULT_FROM_BLOCK", receipt.blockNumber);
  console.log("OPERATOR", signer.address);
  console.log("ENDS_AT", endsAt.toString());
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  console.log("CHAIN", chainId.toString());
  saveDeployment(hre.network.name, {
    chainId: Number(chainId),
    vault: address,
    vaultFromBlock: receipt.blockNumber,
    operator: signer.address,
    endsAt: Number(endsAt),
    periodId: Number(periodId),
  });

  if (process.env.HALLOW_TOKEN) {
    await (await vault.enableGifts(process.env.HALLOW_TOKEN)).wait();
    console.log("GIFTS ON with", process.env.HALLOW_TOKEN);
    saveDeployment(hre.network.name, { hallowToken: process.env.HALLOW_TOKEN });
  } else {
    console.log("GIFTS OFF until enable-gifts.js runs with HALLOW_TOKEN");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
