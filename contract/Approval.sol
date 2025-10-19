// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ERC20 Interface to interact with the token
interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract TokenTransfer {
    address public owner;
    IERC20 public token;

    event TokensTransferred(address indexed from, address indexed to, uint256 amount);

    // Set the token address when deploying the contract
    constructor(address _token) {
        owner = msg.sender;
        token = IERC20(_token);
    }

    // Admin function to transfer tokens
    function transferTokens(address recipient, uint256 amount) public {
        require(msg.sender == owner, "Only the owner can initiate the transfer");
        
        // Ensure the contract has enough balance
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient contract balance");

        // Call the transfer function of the ERC20 token
        bool success = token.transfer(recipient, amount);
        require(success, "Transfer failed");

        // Emit the event
        emit TokensTransferred(address(this), recipient, amount);
    }

    // Function to withdraw tokens to admin if needed
    function withdrawTokens(address recipient, uint256 amount) public {
        require(msg.sender == owner, "Only the owner can withdraw");
        
        uint256 contractBalance = token.balanceOf(address(this));
        require(contractBalance >= amount, "Insufficient balance");

        bool success = token.transfer(recipient, amount);
        require(success, "Transfer failed");

        emit TokensTransferred(address(this), recipient, amount);
    }
}