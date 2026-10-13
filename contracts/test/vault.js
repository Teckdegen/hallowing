const { expect } = require("chai");
const { ethers } = require("hardhat");
const { GIFT_PRICES } = require("../scripts/gifts");
const VIDEO = "0x" + "ab".repeat(32);

const SHARE = 8000n;
const DENOM = 10000n;
const PRICES = GIFT_PRICES.map((price) => ethers.parseEther(String(price)));

describe("HallowingVault", function () {
  async function setup() {
    const [operator, sender, ...rest] = await ethers.getSigners();
    const creators = rest.slice(0, 11);
    const token = await (await ethers.getContractFactory("HallowToken")).deploy(operator.address);
    const endsAt = (await ethers.provider.getBlock("latest")).timestamp + 3600;
    const vault = await (await ethers.getContractFactory("HallowingVault")).deploy(operator.address, endsAt, 1, GIFT_PRICES);
    await vault.connect(operator).enableGifts(await token.getAddress());
    const total = ethers.parseEther("10000000000");
    await token.mint(sender.address, total);
    await token.connect(sender).approve(await vault.getAddress(), total);
    return { operator, sender, creators, token, vault };
  }

  it("prices gifts on chain and counts each type per creator", async function () {
    const { sender, creators, vault, token } = await setup();
    expect((await vault.prices())[0]).to.equal(ethers.parseEther("50000"));
    await vault.connect(sender).gift(creators[0].address, 2, 3, VIDEO);
    await vault.connect(sender).gift(creators[0].address, 0, 1, VIDEO);

    const received = await vault.received(creators[0].address);
    expect(received[2]).to.equal(3n);
    expect(received[0]).to.equal(1n);
    const value = PRICES[2] * 3n + PRICES[0];
    expect(await vault.gifted(creators[0].address)).to.equal(value);
    expect(await vault.totalGifted()).to.equal(value);
    expect(await token.balanceOf(await vault.getAddress())).to.equal(value);
    const [top, totals] = await vault.top();
    expect(top[0]).to.equal(creators[0].address);
    expect(totals[0]).to.equal(value);
    expect(await vault.rankOf(creators[0].address)).to.equal(1n);
    const [list, pageTotals, counts] = await vault.creatorsPage(0, 50);
    expect(list).to.deep.equal([creators[0].address]);
    expect(pageTotals[0]).to.equal(value);
    expect(counts[0][2]).to.equal(3n);
  });

  it("keeps the on chain top 10 equal to a full sort", async function () {
    const { sender, vault } = await setup();
    const wallets = Array.from({ length: 40 }, () => ethers.Wallet.createRandom().address);
    const totals = new Map();
    const firstSeen = [];
    let seed = 7;
    const random = (max) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % max;
    };
    for (let round = 0; round < 160; round += 1) {
      const creator = wallets[random(wallets.length)];
      const giftId = random(4);
      const quantity = 1 + random(5);
      await vault.connect(sender).gift(creator, giftId, quantity, VIDEO);
      if (!totals.has(creator)) firstSeen.push(creator);
      totals.set(creator, (totals.get(creator) ?? 0n) + PRICES[giftId] * BigInt(quantity));
    }
    const [top, topTotals] = await vault.top();
    const expected = [...totals.values()].sort((a, b) => (b > a ? 1 : b < a ? -1 : 0)).slice(0, 10);
    expect(topTotals.map((value) => value)).to.deep.equal(expected);
    for (let index = 0; index < top.length; index += 1) {
      expect(await vault.rankOf(top[index])).to.equal(BigInt(index + 1));
      expect(totals.get(top[index])).to.equal(topTotals[index]);
    }
    expect(await vault.creatorCount()).to.equal(BigInt(firstSeen.length));
  });

  it("keeps gift gas flat as creators grow", async function () {
    const { sender, vault } = await setup();
    const many = Array.from({ length: 150 }, () => ethers.Wallet.createRandom().address);
    for (let index = 0; index < many.length; index += 1) {
      await vault.connect(sender).gift(many[index], 0, 1 + (index % 20), VIDEO);
    }
    const repeat = await (await vault.connect(sender).gift(many[3], 0, 1, VIDEO)).wait();
    const climbToTop = await (await vault.connect(sender).gift(many[120], 9, 99, VIDEO)).wait();
    const fresh = await (await vault.connect(sender).gift(ethers.Wallet.createRandom().address, 0, 1, VIDEO)).wait();
    console.log(`      gas  repeat gift ${repeat.gasUsed}  new creator ${fresh.gasUsed}  climb from outside to #1 ${climbToTop.gasUsed}`);
    expect(repeat.gasUsed).to.be.lessThan(90_000n);
    expect(fresh.gasUsed).to.be.lessThan(140_000n);
    expect(climbToTop.gasUsed).to.be.lessThan(200_000n);
    expect((await vault.top())[0][0]).to.equal(many[120]);

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);
    const settle = await (await vault.settle()).wait();
    console.log(`      gas  settle with ${many.length + 1} creators ${settle.gasUsed}`);
    expect(settle.gasUsed).to.be.lessThan(400_000n);
  });

  it("emits readable events for every gift and every payout", async function () {
    const { sender, creators, vault } = await setup();
    const video = "0x" + "12".repeat(16).padStart(64, "0");
    await expect(vault.connect(sender).gift(creators[0].address, 3, 2, video))
      .to.emit(vault, "Gifted")
      .withArgs(sender.address, creators[0].address, video, 3n, 2n, PRICES[3] * 2n, PRICES[3] * 2n);
    await vault.connect(sender).gift(creators[1].address, 0, 1, ethers.ZeroHash);

    const byVideo = await vault.queryFilter(vault.filters.Gifted(null, null, video));
    expect(byVideo.length).to.equal(1);
    expect(byVideo[0].args.giftId).to.equal(3n);
    const byCreator = await vault.queryFilter(vault.filters.Gifted(null, creators[1].address));
    expect(byCreator.length).to.equal(1);
    expect(byCreator[0].args.videoId).to.equal(ethers.ZeroHash);

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);
    const pool = ((PRICES[3] * 2n + PRICES[0]) * SHARE) / DENOM;
    const first = (pool * PRICES[3] * 2n) / (PRICES[3] * 2n + PRICES[0]);
    await expect(vault.settle()).to.emit(vault, "Paid").withArgs(creators[0].address, 1n, first);
    const paid = await vault.queryFilter(vault.filters.Paid());
    expect(paid.map((log) => log.args.rank)).to.deep.equal([1n, 2n]);
  });

  it("keeps gifting off until the operator enables the token, once", async function () {
    const [operator, sender, creator] = await ethers.getSigners();
    const endsAt = (await ethers.provider.getBlock("latest")).timestamp + 3600;
    const vault = await (await ethers.getContractFactory("HallowingVault")).deploy(operator.address, endsAt, 1, GIFT_PRICES);
    const token = await (await ethers.getContractFactory("HallowToken")).deploy(operator.address);
    expect(await vault.giftsEnabled()).to.equal(false);
    expect((await vault.prices())[0]).to.equal(50000n);
    await expect(vault.connect(sender).gift(creator.address, 0, 1, VIDEO)).to.be.revertedWithCustomError(vault, "GiftsOff");
    await expect(vault.connect(sender).enableGifts(await token.getAddress())).to.be.revertedWithCustomError(vault, "NotOperator");
    await expect(vault.connect(operator).enableGifts(sender.address)).to.be.revertedWithCustomError(vault, "BadAddress");

    await expect(vault.connect(operator).enableGifts(await token.getAddress()))
      .to.emit(vault, "GiftsEnabled")
      .withArgs(await token.getAddress(), 18);
    expect(await vault.giftsEnabled()).to.equal(true);
    expect((await vault.prices())[0]).to.equal(PRICES[0]);
    await expect(vault.connect(operator).enableGifts(await token.getAddress())).to.be.revertedWithCustomError(vault, "TokenAlreadySet");

    await token.mint(sender.address, PRICES[0]);
    await token.connect(sender).approve(await vault.getAddress(), PRICES[0]);
    await vault.connect(sender).gift(creator.address, 0, 1, VIDEO);
    expect(await vault.gifted(creator.address)).to.equal(PRICES[0]);
  });

  it("rejects unknown gifts and out of range quantities", async function () {
    const { sender, creators, vault } = await setup();
    await expect(vault.connect(sender).gift(creators[0].address, 10, 1, VIDEO)).to.be.revertedWithCustomError(vault, "BadGift");
    await expect(vault.connect(sender).gift(creators[0].address, 0, 0, VIDEO)).to.be.revertedWithCustomError(vault, "BadQuantity");
    await expect(vault.connect(sender).gift(creators[0].address, 0, 100, VIDEO)).to.be.revertedWithCustomError(vault, "BadQuantity");
  });

  it("splits 80 percent of the pool across the top 10", async function () {
    const { operator, sender, creators, token, vault } = await setup();
    let deposited = 0n;
    for (let index = 0; index < 11; index += 1) {
      const quantity = BigInt(11 - index);
      deposited += PRICES[0] * quantity;
      await vault.connect(sender).gift(creators[index].address, 0, quantity, VIDEO);
    }

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);
    await vault.settle();

    const pool = (deposited * SHARE) / DENOM;
    const topSum = 65n * PRICES[0];
    let paid = 0n;
    for (let index = 0; index < 10; index += 1) {
      const payout = (pool * PRICES[0] * BigInt(11 - index)) / topSum;
      paid += payout;
      expect(await token.balanceOf(creators[index].address)).to.equal(payout);
    }
    expect(await token.balanceOf(creators[10].address)).to.equal(0n);
    expect(await token.balanceOf(await vault.getAddress())).to.equal(deposited - paid);
    expect(await vault.settled()).to.equal(true);

    const leftover = await token.balanceOf(await vault.getAddress());
    await vault.connect(operator).operatorWithdraw(leftover);
    expect(await token.balanceOf(operator.address)).to.equal(leftover);
  });

  it("rejects a withdraw from anyone except the operator", async function () {
    const { sender, vault } = await setup();
    await expect(vault.connect(sender).operatorWithdraw(1)).to.be.revertedWithCustomError(vault, "NotOperator");
  });

  it("closes gifting after the season ends", async function () {
    const { sender, creators, vault } = await setup();
    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine", []);
    await expect(vault.connect(sender).gift(creators[0].address, 0, 1, VIDEO)).to.be.revertedWithCustomError(vault, "PeriodEnded");
  });
});
