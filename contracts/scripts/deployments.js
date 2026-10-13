const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "..", "deployments.json");
const networks = { robinhoodTestnet: "testnet", robinhood: "mainnet" };

/** Merges fields into the app's deployments.json entry for the Hardhat network being used. */
function saveDeployment(networkName, patch) {
  const key = networks[networkName];
  if (!key) return;
  const all = JSON.parse(fs.readFileSync(file, "utf8"));
  all[key] = { ...all[key], ...patch };
  fs.writeFileSync(file, `${JSON.stringify(all, null, 2)}\n`);
  console.log(`deployments.json ${key} updated`);
}

module.exports = { saveDeployment };
