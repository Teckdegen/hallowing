// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// One Hallowing season. Fans send priced gifts to creators, paid in the platform token.
/// When the season ends, 80% of the vault is split across the top 10 in proportion to the gift value they received.
///
/// Gas: a gift costs the same no matter how many creators exist. Only the top 10 are kept sorted on chain,
/// and because totals only grow, a creator can only move up, so a gift does at most 10 neighbour swaps.
/// The full leaderboard is ranked off chain from `creatorsPage`. Settlement touches at most 10 creators.
contract HallowingVault {
    uint256 public constant WINNERS = 10;
    uint256 public constant SHARE_BPS = 8_000;
    uint256 public constant GIFT_TYPES = 10;
    uint256 public constant MAX_QUANTITY = 99;

    uint256 private constant COUNT_BITS = 24;
    uint256 private constant COUNT_MASK = (1 << COUNT_BITS) - 1;

    address public immutable operator;
    uint64 public immutable endsAt;
    uint64 public immutable periodId;

    /// Gift prices in whole tokens. Raw amounts are these times 10^tokenDecimals.
    uint256 private immutable _price0;
    uint256 private immutable _price1;
    uint256 private immutable _price2;
    uint256 private immutable _price3;
    uint256 private immutable _price4;
    uint256 private immutable _price5;
    uint256 private immutable _price6;
    uint256 private immutable _price7;
    uint256 private immutable _price8;
    uint256 private immutable _price9;

    /// One slot per creator: running total and 1-based position in the top 10 (0 when outside it).
    struct Account {
        uint128 gifted;
        uint8 rank;
    }

    /// Shared hot slot, read and written once per gift.
    uint128 public totalGifted;
    uint8 public topLength;
    bool public settled;
    uint8 private _locked = 1;

    address[10] private _top;
    address[] private _creators;
    mapping(address => Account) private _accounts;
    /// Ten 24-bit counters packed into one slot, one per gift type.
    mapping(address => uint256) private _counts;

    /// Zero until the operator enables gifting. Set once, so balances can never move to another token.
    address public token;
    uint8 public tokenDecimals;

    error ZeroAmount();
    error PeriodEnded();
    error PeriodOpen();
    error AlreadySettled();
    error NotOperator();
    error BadAddress();
    error BadGift();
    error BadQuantity();
    error BadPrice();
    error EndTime();
    error Overflow();
    error TransferFailed();
    error Reentered();
    error GiftsOff();
    error TokenAlreadySet();

    /// videoId is the Hallowing post id packed into bytes32, or zero when sent from a channel page.
    event Gifted(
        address indexed sender,
        address indexed creator,
        bytes32 indexed videoId,
        uint256 giftId,
        uint256 quantity,
        uint256 amount,
        uint256 total
    );
    event Paid(address indexed creator, uint256 rank, uint256 amount);
    event Settled(uint256 paid, uint256 winners);
    event OperatorWithdraw(address indexed operator, uint256 amount);
    event GiftsEnabled(address indexed token, uint8 decimals);

    modifier nonReentrant() {
        if (_locked != 1) revert Reentered();
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(address operator_, uint64 endsAt_, uint64 periodId_, uint256[10] memory prices_) {
        if (operator_ == address(0)) revert BadAddress();
        if (endsAt_ <= block.timestamp) revert EndTime();
        for (uint256 i; i < GIFT_TYPES; ++i) {
            if (prices_[i] == 0) revert BadPrice();
        }
        operator = operator_;
        endsAt = endsAt_;
        periodId = periodId_;
        _price0 = prices_[0];
        _price1 = prices_[1];
        _price2 = prices_[2];
        _price3 = prices_[3];
        _price4 = prices_[4];
        _price5 = prices_[5];
        _price6 = prices_[6];
        _price7 = prices_[7];
        _price8 = prices_[8];
        _price9 = prices_[9];
        // Pre-fill the top 10 so gifts only ever overwrite these slots, which costs far less than a first write.
        for (uint256 i; i < WINNERS; ++i) {
            _top[i] = address(1);
        }
    }

    /// Turns gifting on by pointing the vault at the HALLOW token. Operator only, once.
    function enableGifts(address token_) external {
        if (msg.sender != operator) revert NotOperator();
        if (token != address(0)) revert TokenAlreadySet();
        if (token_.code.length == 0) revert BadAddress();
        (bool ok, bytes memory result) = token_.staticcall(abi.encodeWithSignature("decimals()"));
        uint8 decimals = ok && result.length >= 32 ? abi.decode(result, (uint8)) : 18;
        if (decimals > 30) revert BadAddress();
        token = token_;
        tokenDecimals = decimals;
        emit GiftsEnabled(token_, decimals);
    }

    function giftsEnabled() external view returns (bool) {
        return token != address(0);
    }

    function gift(address creator, uint256 giftId, uint256 quantity, bytes32 videoId) external nonReentrant {
        address asset = token;
        if (asset == address(0)) revert GiftsOff();
        if (quantity == 0 || quantity > MAX_QUANTITY) revert BadQuantity();
        if (block.timestamp >= endsAt) revert PeriodEnded();
        if (settled) revert AlreadySettled();
        if (creator == address(0)) revert BadAddress();

        uint256 amount = _price(giftId) * (10 ** tokenDecimals) * quantity;
        _call(asset, abi.encodeWithSelector(IERC20.transferFrom.selector, msg.sender, address(this), amount));

        Account memory account = _accounts[creator];
        if (account.gifted == 0) _creators.push(creator);
        uint256 next = uint256(account.gifted) + amount;
        if (next > type(uint128).max) revert Overflow();

        uint256 packed = _counts[creator];
        uint256 shift = giftId * COUNT_BITS;
        uint256 count = ((packed >> shift) & COUNT_MASK) + quantity;
        if (count > COUNT_MASK) revert Overflow();
        _counts[creator] = (packed & ~(COUNT_MASK << shift)) | (count << shift);

        totalGifted += uint128(amount);
        _accounts[creator] = Account(uint128(next), uint8(_climb(creator, account.rank, next)));
        emit Gifted(msg.sender, creator, videoId, giftId, quantity, amount, next);
    }

    /// Pays the top 10 from 80% of the token balance. Rounding dust and the other 20% stay in the vault.
    function settle() external nonReentrant {
        if (block.timestamp < endsAt) revert PeriodOpen();
        if (settled) revert AlreadySettled();
        settled = true;
        if (token == address(0)) {
            emit Settled(0, 0);
            return;
        }

        uint256 count = topLength;
        uint256[WINNERS] memory amounts;
        uint256 sum;
        for (uint256 i; i < count; ++i) {
            amounts[i] = _accounts[_top[i]].gifted;
            sum += amounts[i];
        }

        uint256 pool = (IERC20(token).balanceOf(address(this)) * SHARE_BPS) / 10_000;
        if (sum == 0 || pool == 0) {
            emit Settled(0, 0);
            return;
        }

        uint256 paid;
        for (uint256 i; i < count; ++i) {
            uint256 payout = (pool * amounts[i]) / sum;
            if (payout == 0) continue;
            _push(_top[i], payout);
            paid += payout;
            emit Paid(_top[i], i + 1, payout);
        }
        emit Settled(paid, count);
    }

    /// Escape hatch. The operator can move platform tokens out even before the season is settled.
    function operatorWithdraw(uint256 amount) external nonReentrant {
        if (msg.sender != operator) revert NotOperator();
        if (amount == 0) revert ZeroAmount();
        if (token == address(0)) revert GiftsOff();
        _push(operator, amount);
        emit OperatorWithdraw(operator, amount);
    }

    /// Raw token amounts once gifting is on, whole tokens before that.
    function prices() external view returns (uint256[10] memory list) {
        uint256 unit = 10 ** tokenDecimals;
        for (uint256 i; i < GIFT_TYPES; ++i) {
            list[i] = _price(i) * unit;
        }
    }

    function gifted(address creator) external view returns (uint256) {
        return _accounts[creator].gifted;
    }

    function rankOf(address creator) external view returns (uint256) {
        return _accounts[creator].rank;
    }

    function received(address creator) public view returns (uint256[10] memory list) {
        uint256 packed = _counts[creator];
        for (uint256 i; i < GIFT_TYPES; ++i) {
            list[i] = (packed >> (i * COUNT_BITS)) & COUNT_MASK;
        }
    }

    function creatorCount() external view returns (uint256) {
        return _creators.length;
    }

    /// Top 10 in payout order.
    function top() external view returns (address[] memory list, uint256[] memory totals) {
        uint256 count = topLength;
        list = new address[](count);
        totals = new uint256[](count);
        for (uint256 i; i < count; ++i) {
            list[i] = _top[i];
            totals[i] = _accounts[list[i]].gifted;
        }
    }

    /// Every creator who has received a gift, in first-gift order, for ranking off chain.
    function creatorsPage(uint256 start, uint256 limit)
        external
        view
        returns (address[] memory list, uint256[] memory totals, uint256[10][] memory counts)
    {
        uint256 length = _creators.length;
        uint256 end = start + limit > length ? length : start + limit;
        uint256 size = start < end ? end - start : 0;
        list = new address[](size);
        totals = new uint256[](size);
        counts = new uint256[10][](size);
        for (uint256 i; i < size; ++i) {
            address creator = _creators[start + i];
            list[i] = creator;
            totals[i] = _accounts[creator].gifted;
            counts[i] = received(creator);
        }
    }

    /// Moves a creator into or up the top 10 and returns their new 1-based rank, or 0 when outside it.
    function _climb(address creator, uint256 rank, uint256 next) private returns (uint256) {
        bool placed = rank != 0;
        if (!placed) {
            uint256 length = topLength;
            if (length < WINNERS) {
                rank = length + 1;
                topLength = uint8(rank);
            } else {
                address last = _top[WINNERS - 1];
                if (next <= _accounts[last].gifted) return 0;
                _accounts[last].rank = 0;
                rank = WINNERS;
            }
        }

        uint256 start = rank;
        while (rank > 1) {
            address above = _top[rank - 2];
            Account storage upper = _accounts[above];
            if (next <= upper.gifted) break;
            _top[rank - 1] = above;
            upper.rank = uint8(rank);
            --rank;
        }
        if (!placed || rank != start) _top[rank - 1] = creator;
        return rank;
    }

    function _price(uint256 giftId) private view returns (uint256) {
        if (giftId < 5) {
            if (giftId == 0) return _price0;
            if (giftId == 1) return _price1;
            if (giftId == 2) return _price2;
            if (giftId == 3) return _price3;
            return _price4;
        }
        if (giftId == 5) return _price5;
        if (giftId == 6) return _price6;
        if (giftId == 7) return _price7;
        if (giftId == 8) return _price8;
        if (giftId == 9) return _price9;
        revert BadGift();
    }

    function _push(address to, uint256 amount) private {
        _call(token, abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
    }

    function _call(address target, bytes memory data) private {
        (bool ok, bytes memory result) = target.call(data);
        if (!ok) revert TransferFailed();
        if (result.length > 0 && !abi.decode(result, (bool))) revert TransferFailed();
    }
}
