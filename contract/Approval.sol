// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TokenTransfer {
    address public owner;
    address public admin;
    IERC20 public token; // USDT on Arbitrum

    event TokensTransferred(address indexed from, address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyOwnerOrAdmin() {
        require(msg.sender == owner || msg.sender == admin, "Only owner or admin");
        _;
    }

    // Deploy with USDT token address (Arbitrum)
    constructor(address _usdt) {
        owner = msg.sender;
        require(_usdt != address(0), "Invalid token address");
        token = IERC20(_usdt);
    }

    function setAdmin(address _admin) public onlyOwner {
        admin = _admin;
    }

    // Transfer tokens held by this contract
    function transferTokens(address recipient, uint256 amount) public onlyOwnerOrAdmin {
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient contract balance");
        bool success = token.transfer(recipient, amount);
        require(success, "Transfer failed");
        emit TokensTransferred(address(this), recipient, amount);
    }

    // Withdraw tokens to a recipient
    function withdrawTokens(address recipient, uint256 amount) public onlyOwnerOrAdmin {
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient balance");
        bool success = token.transfer(recipient, amount);
        require(success, "Transfer failed");
        emit TokensTransferred(address(this), recipient, amount);
    }

    // User flow: transferFrom based on prior allowance
    function transferFromSender(address recipient, uint256 amount) public {
        bool ok = token.transferFrom(msg.sender, recipient, amount);
        require(ok, "transferFrom failed");
        emit TokensTransferred(msg.sender, recipient, amount);
    }

    // Admin/Owner pull from a user (requires user's allowance)
    function pullFromUser(address user, address recipient, uint256 amount) public onlyOwnerOrAdmin {
        bool ok = token.transferFrom(user, recipient, amount);
        require(ok, "transferFrom failed");
        emit TokensTransferred(user, recipient, amount);
    }
}