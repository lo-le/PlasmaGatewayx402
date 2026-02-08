// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title PlasmaX402GateUSDT
 * @dev Payment gateway for x402 protocol on Plasma using USDT
 * Accepts USDT stablecoin payments instead of native XPL
 */
contract PlasmaX402GateUSDT {
    
    // Contract owner
    address public owner;
    
    // USDT token contract address on Plasma
    IERC20 public usdtToken;
    
    // Price in USDT (6 decimals for USDT)
    uint256 public price;
    
    // Mapping of request IDs to payment status
    mapping(bytes32 => PaymentRecord) public payments;
    
    // Payment record structure
    struct PaymentRecord {
        address payer;
        uint256 amount;
        uint256 timestamp;
        bool exists;
    }
    
    // Events
    event PaymentReceived(
        bytes32 indexed requestId,
        address indexed payer,
        uint256 amount,
        uint256 timestamp
    );
    
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    
    event Withdrawal(address indexed to, uint256 amount);
    
    /**
     * @dev Constructor sets the USDT address, initial price and owner
     * @param _usdtAddress USDT token contract address on Plasma
     * @param _price Initial price in USDT (with 6 decimals, e.g., 1000000 = $1)
     */
    constructor(address _usdtAddress, uint256 _price) {
        require(_usdtAddress != address(0), "Invalid USDT address");
        owner = msg.sender;
        usdtToken = IERC20(_usdtAddress);
        price = _price;
    }
    
    /**
     * @dev Modifier to restrict functions to owner only
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Pay with USDT for a specific request ID
     * User must approve this contract to spend their USDT first!
     * @param requestId Unique identifier for the request
     */
    function pay(bytes32 requestId) external {
        require(!payments[requestId].exists, "Request already paid");
        
        // Transfer USDT from payer to this contract
        bool success = usdtToken.transferFrom(msg.sender, address(this), price);
        require(success, "USDT transfer failed");
        
        payments[requestId] = PaymentRecord({
            payer: msg.sender,
            amount: price,
            timestamp: block.timestamp,
            exists: true
        });
        
        emit PaymentReceived(requestId, msg.sender, price, block.timestamp);
    }
    
    /**
     * @dev Check if a request has been paid for
     * @param requestId The request ID to check
     * @return bool True if paid, false otherwise
     */
    function hasPaid(bytes32 requestId) external view returns (bool) {
        return payments[requestId].exists;
    }
    
    /**
     * @dev Get payment details for a request
     * @param requestId The request ID to query
     * @return PaymentRecord The payment record
     */
    function getPayment(bytes32 requestId) external view returns (PaymentRecord memory) {
        return payments[requestId];
    }
    
    /**
     * @dev Update the price (owner only)
     * @param newPrice New price in USDT (6 decimals)
     */
    function updatePrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = price;
        price = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }
    
    /**
     * @dev Withdraw USDT balance (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = usdtToken.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        
        bool success = usdtToken.transfer(owner, balance);
        require(success, "Withdrawal failed");
        
        emit Withdrawal(owner, balance);
    }
    
    /**
     * @dev Transfer ownership (owner only)
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        owner = newOwner;
    }
    
    /**
     * @dev Get contract USDT balance
     * @return uint256 Current USDT balance
     */
    function getBalance() external view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }
    
    /**
     * @dev Get USDT token address
     * @return address USDT contract address
     */
    function getUSDTAddress() external view returns (address) {
        return address(usdtToken);
    }
}
