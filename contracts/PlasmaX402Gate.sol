// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PlasmaX402Gate
 * @dev Payment gateway contract for x402 protocol on Plasma
 * Allows AI agents to pay for access to premium content/services
 */
contract PlasmaX402Gate {
    
    // Contract owner
    address public owner;
    
    // Price for accessing premium content (in wei)
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
     * @dev Constructor sets the initial price and owner
     * @param _price Initial price in wei (e.g., 0.01 ether = 10000000000000000)
     */
    constructor(uint256 _price) {
        owner = msg.sender;
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
     * @dev Record a payment for a specific request ID
     * @param requestId Unique identifier for the request
     */
    function pay(bytes32 requestId) external payable {
        require(msg.value >= price, "Insufficient payment amount");
        require(!payments[requestId].exists, "Request already paid");
        
        payments[requestId] = PaymentRecord({
            payer: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            exists: true
        });
        
        emit PaymentReceived(requestId, msg.sender, msg.value, block.timestamp);
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
     * @param newPrice New price in wei
     */
    function updatePrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = price;
        price = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }
    
    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner).call{value: balance}("");
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
     * @dev Get contract balance
     * @return uint256 Current balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Fallback function to receive payments
     */
    receive() external payable {
        // Accept payments but don't record them without request ID
        // Use pay() function instead for proper tracking
    }
}
