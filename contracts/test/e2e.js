const { expect } = require("chai");
const { ethers } = require("hardhat");
const { GIFT_PRICES } = require("../scripts/gifts");
const VIDEO = "0x" + "ab".repeat(32);

const GIFT_NAMES = ["Candy Corn", "Little Boo", "Pumpkin Puff", "Batty", "Midnight Cat", "Witchy Brew", "Moonlit Broom", "Spirit Lantern", "Skeleton Dance", "Haunted Manor"];
const PRICES = GIFT_PRICES.map((price) => ethers.parseEther(String(price)));
const CREATORS = 100;
const FANS = 25;
const GIFTS = 600;

function rng(seed) {
  let state = seed;
  return (max) => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state % max;
  };
}

const desc = (a, b) => (b > a ? 1 : b < a ? -1 : 0);

function printCost(ledger) {
  const gasPrice = BigInt(process.env.GAS_PRICE_WEI || "20298000");
  const ethUsd = Number(process.env.ETH_USD || "2504.97");
  const usd = (gas) => (Number(gas * gasPrice) / 1e18) * ethUsd;
  const money = (value) => (value < 0.01 ? `$${value.toFixed(5)}` : `$${value.toFixed(2)}`);
  const rows = [
    ["Deploy HALLOW token (test only)", ledger.deployToken, 1],
    ["Deploy season vault", ledger.deployVault, 1],
    ["Operator enables gifts", ledger.enableGifts, 1],
    ["Mint HALLOW to fans (test only)", ledger.mint, 25],
    ["Fan approves vault (once each)", ledger.approve, 25],
    ["Gifts", ledger.gifts, ledger.giftCount],
    ["Settle and pay top 10", ledger.settle, 1],
    ["Operator withdraws 20%", ledger.withdraw, 1],
  ];
  const total = rows.reduce((sum, [, gas]) => sum + gas, 0n);
  console.log(`\n      Cost at ${Number(gasPrice) / 1e9} gwei and ETH $${ethUsd}`);
  console.table(
    rows.map(([action, gas, count]) => ({
      action,
      txs: count,
      gas: gas.toLocaleString("en-US"),
      "total USD": money(usd(gas)),
      "per tx USD": money(usd(gas) / count),
    })),
  );
  console.log(`      Whole run: ${total.toLocaleString("en-US")} gas = ${(Number(total * gasPrice) / 1e18).toFixed(8)} ETH = ${money(usd(total))}`);
}
const fmt = (raw) => Number(ethers.formatEther(raw)).toLocaleString("en-US", { maximumFractionDigits: 2 });

describe("Hallowing season end to end", function () {
  this.timeout(600_000);

  it("gifts across 100 creators, ranks them, and pays the top 10", async function () {
    const [operator] = await ethers.getSigners();
    const ledger = { deployToken: 0n, deployVault: 0n, mint: 0n, approve: 0n, gifts: 0n, giftCount: 0, settle: 0n, withdraw: 0n };
    const used = async (tx) => (await tx.wait()).gasUsed;
    const token = await (await ethers.getContractFactory("HallowToken")).deploy(operator.address);
    ledger.deployToken = (await token.deploymentTransaction().wait()).gasUsed;
    const start = (await ethers.provider.getBlock("latest")).timestamp;
    const vault = await (await ethers.getContractFactory("HallowingVault")).deploy(operator.address, start + 7 * 86400, 1, GIFT_PRICES);
    ledger.deployVault = (await vault.deploymentTransaction().wait()).gasUsed;
    ledger.enableGifts = await used(await vault.connect(operator).enableGifts(await token.getAddress()));
    const vaultAddress = await vault.getAddress();

    const creators = Array.from({ length: CREATORS }, () => ethers.Wallet.createRandom().address);
    const fans = [];
    for (let index = 0; index < FANS; index += 1) {
      const fan = ethers.Wallet.createRandom().connect(ethers.provider);
      await ethers.provider.send("hardhat_setBalance", [fan.address, "0x56BC75E2D63100000"]);
      ledger.mint += await used(await token.mint(fan.address, ethers.parseEther("50000000000")));
      ledger.approve += await used(await token.connect(fan).approve(vaultAddress, ethers.MaxUint256));
      fans.push(fan);
    }

    const random = rng(2026);
    const totals = new Map(creators.map((creator) => [creator, 0n]));
    const counts = new Map(creators.map((creator) => [creator, Array(10).fill(0n)]));
    const spent = new Map(fans.map((fan) => [fan.address, 0n]));
    const gas = [];
    let deposited = 0n;

    for (let round = 0; round < GIFTS; round += 1) {
      const hot = random(4) === 0;
      const creator = hot ? creators[random(15)] : creators[random(CREATORS)];
      const roll = random(100);
      const giftId = roll < 40 ? random(3) : roll < 75 ? 3 + random(3) : roll < 95 ? 6 + random(2) : 8 + random(2);
      const quantity = 1 + random(giftId < 4 ? 20 : 3);
      const fan = fans[random(FANS)];
      const receipt = await (await vault.connect(fan).gift(creator, giftId, quantity, VIDEO)).wait();
      gas.push(receipt.gasUsed);

      const amount = PRICES[giftId] * BigInt(quantity);
      totals.set(creator, totals.get(creator) + amount);
      counts.get(creator)[giftId] += BigInt(quantity);
      spent.set(fan.address, spent.get(fan.address) + amount);
      deposited += amount;
    }
    for (const creator of creators) {
      if (totals.get(creator) === 0n) {
        const filler = await used(await vault.connect(fans[0]).gift(creator, 0, 1, VIDEO));
        ledger.gifts += filler;
        ledger.giftCount += 1;
        totals.set(creator, PRICES[0]);
        counts.get(creator)[0] += 1n;
        deposited += PRICES[0];
      }
    }

    expect(await vault.creatorCount()).to.equal(BigInt(CREATORS));
    expect(await vault.totalGifted()).to.equal(deposited);
    expect(await token.balanceOf(vaultAddress)).to.equal(deposited);

    const [list, pageTotals, pageCounts] = await vault.creatorsPage(0, 250);
    expect(list.length).to.equal(CREATORS);
    list.forEach((creator, index) => {
      expect(pageTotals[index]).to.equal(totals.get(creator));
      expect(pageCounts[index].map((value) => value)).to.deep.equal(counts.get(creator));
    });

    const ranked = [...totals.entries()].sort((a, b) => desc(a[1], b[1]));
    const [top, topTotals] = await vault.top();
    expect(top.length).to.equal(10);
    expect([...topTotals]).to.deep.equal(ranked.slice(0, 10).map(([, total]) => total));
    for (let index = 0; index < 10; index += 1) {
      expect(totals.get(top[index])).to.equal(topTotals[index]);
      expect(await vault.rankOf(top[index])).to.equal(BigInt(index + 1));
    }

    await expect(vault.settle()).to.be.revertedWithCustomError(vault, "PeriodOpen");
    await ethers.provider.send("evm_increaseTime", [7 * 86400 + 1]);
    await ethers.provider.send("evm_mine", []);
    await expect(vault.connect(fans[0]).gift(creators[0], 0, 1, VIDEO)).to.be.revertedWithCustomError(vault, "PeriodEnded");

    const settleReceipt = await (await vault.connect(fans[1]).settle()).wait();
    await expect(vault.settle()).to.be.revertedWithCustomError(vault, "AlreadySettled");

    const pool = (deposited * 8000n) / 10000n;
    const topSum = topTotals.reduce((sum, value) => sum + value, 0n);
    let paid = 0n;
    const rows = [];
    for (let index = 0; index < 10; index += 1) {
      const expected = (pool * topTotals[index]) / topSum;
      const balance = await token.balanceOf(top[index]);
      expect(balance).to.equal(expected);
      paid += expected;
      rows.push({
        rank: index + 1,
        creator: `${top[index].slice(0, 6)}…${top[index].slice(-4)}`,
        gifted: fmt(topTotals[index]),
        share: `${((Number(topTotals[index]) / Number(topSum)) * 100).toFixed(2)}%`,
        payout: fmt(balance),
        best: GIFT_NAMES[counts.get(top[index]).reduce((best, value, id, all) => (value * PRICES[id] > all[best] * PRICES[best] ? id : best), 0)],
      });
    }
    for (const [creator] of ranked.slice(10)) {
      expect(await token.balanceOf(creator)).to.equal(0n);
    }
    const left = await token.balanceOf(vaultAddress);
    expect(left).to.equal(deposited - paid);
    expect(paid).to.be.lessThanOrEqual(pool);
    expect(pool - paid).to.be.lessThan(10n);

    const sorted = [...gas].sort(desc).reverse();
    const average = gas.reduce((sum, value) => sum + value, 0n) / BigInt(gas.length);
    const giftTotals = Array(10).fill(0n);
    for (const list of counts.values()) list.forEach((value, id) => (giftTotals[id] += value));

    console.log(`\n      ${CREATORS} creators, ${FANS} fans, ${gas.length} gifts, ${fmt(deposited)} HALLOW gifted`);
    console.log("      Gifts sent:", GIFT_NAMES.map((name, id) => `${name} ${giftTotals[id]}`).join(", "));
    console.table(rows);
    console.log(`      Pot paid to top 10: ${fmt(paid)} HALLOW (80%)`);
    console.log(`      Left in vault:      ${fmt(left)} HALLOW (20% plus ${pool - paid} wei rounding)`);
    console.log(`      Ranks 11 to ${CREATORS}: 0 paid`);
    console.log(`      Gift gas  min ${sorted[0]}  avg ${average}  max ${sorted[sorted.length - 1]}`);
    console.log(`      Settle gas ${settleReceipt.gasUsed}`);

    // Worst case: a creator's first gift that jumps them from outside the top 10 to first place.
    expect(sorted[sorted.length - 1]).to.be.lessThan(215_000n);
    expect(average).to.be.lessThan(80_000n);
    expect(settleReceipt.gasUsed).to.be.lessThan(400_000n);

    ledger.withdraw = await used(await vault.connect(operator).operatorWithdraw(left));
    ledger.settle = settleReceipt.gasUsed;
    ledger.gifts += gas.reduce((sum, value) => sum + value, 0n);
    ledger.giftCount += gas.length;
    printCost(ledger);
    expect(await token.balanceOf(vaultAddress)).to.equal(0n);
  });
});
