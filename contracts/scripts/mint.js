const hre = require("hardhat");

/** Testnet: mints the deployments.json HALLOW to MINT_TO (comma-separated). Only the token operator can mint. */
async function main() {
  const network = hre.network.name === "robinhood" ? "mainnet" : "testnet";
  const address = process.env.HALLOW_TOKEN || require("../../deployments.json")[network].hallowToken;
  const recipients = (process.env.MINT_TO || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (!address || !recipients.length) throw new Error("Set MINT_TO, and HALLOW_TOKEN if deployments.json has none.");
  const token = await hre.ethers.getContractAt("HallowToken", address);
  const amount = hre.ethers.parseUnits(process.env.MINT_AMOUNT || "100000000", 18);
  for (const to of recipients) {
    await (await token.mint(to, amount)).wait();
    console.log("MINTED", hre.ethers.formatUnits(amount, 18), "to", to, "balance", hre.ethers.formatUnits(await token.balanceOf(to), 18));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
