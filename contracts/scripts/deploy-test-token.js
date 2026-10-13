const hre = require("hardhat");
const { saveDeployment } = require("./deployments");

/** Testnet only: a HALLOW stand-in the deployer can mint. MINT_TO is a comma-separated list. */
async function main() {
  const [signer] = await hre.ethers.getSigners();
  const token = await (await hre.ethers.getContractFactory("HallowToken")).deploy(signer.address);
  await token.waitForDeployment();
  console.log("HALLOW", await token.getAddress());
  saveDeployment(hre.network.name, { hallowToken: await token.getAddress() });
  const amount = hre.ethers.parseUnits(process.env.MINT_AMOUNT || "100000000", 18);
  const recipients = (process.env.MINT_TO || signer.address).split(",").map((value) => value.trim()).filter(Boolean);
  for (const to of recipients) {
    await (await token.mint(to, amount)).wait();
    console.log("MINTED", hre.ethers.formatUnits(amount, 18), "to", to);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
