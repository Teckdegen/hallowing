// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// Platform token used to back creators. Gas on Robinhood Chain is ETH. This token is not ETH.
contract HallowToken {
    string public constant name = "HALLOW";
    string public constant symbol = "HALLOW";
    uint8 public constant decimals = 18;

    address public operator;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    error NotOperator();
    error BadRecipient();

    constructor(address operator_) {
        if (operator_ == address(0)) revert BadRecipient();
        operator = operator_;
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != operator) revert NotOperator();
        if (to == address(0)) revert BadRecipient();
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _move(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < amount) revert BadRecipient();
            allowance[from][msg.sender] = allowed - amount;
        }
        _move(from, to, amount);
        return true;
    }

    function _move(address from, address to, uint256 amount) private {
        if (to == address(0)) revert BadRecipient();
        uint256 balance = balanceOf[from];
        if (balance < amount) revert BadRecipient();
        balanceOf[from] = balance - amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
