// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
}

/**
 * @title PlasmaX402MultiToken
 * @dev Payment gateway for x402 protocol supporting multiple stablecoins
 * Accepts USDT, USDC, DAI, and any other ERC20 stablecoins
 */
contract PlasmaX402MultiToken {
    
    // Contract owner
    address public owner;
    
    // Supported tokens (token address => is supported)
    mapping(address => bool) public supportedTokens;
    
    // Token symbols for reference (token address => symbol)
    mapping(address => string) public tokenSymbols;
    
    // Price in USD (6 decimals, e.g., 1000000 = $1.00)
    uint256 public priceUSD;
    
    // Mapping of request IDs to payment status
    mapping(bytes32 => PaymentRecord) public payments;
    
    // List of all supported token addresses
    address[] public tokenList;
    
    // Payment record structure
    struct PaymentRecord {
        address payer;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool exists;
    }
    
    // Events
    event PaymentReceived(
        bytes32 indexed requestId,
        address indexed payer,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    
    event TokenAdded(address indexed token, string symbol);
    event TokenRemoved(address indexed token);
    event PriceUpdated(uint256 oldPrice, uint256 newPrice);
    event Withdrawal(address indexed token, address indexed to, uint256 amount);
    
    /**
     * @dev Constructor sets the initial price and owner
     * @param _priceUSD Initial price in USD (6 decimals, e.g., 1000000 = $1)
     */
    constructor(uint256 _priceUSD) {
        owner = msg.sender;
        priceUSD = _priceUSD;
    }
    
    /**
     * @dev Modifier to restrict functions to owner only
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Add a supported stablecoin
     * @param tokenAddress Address of the ERC20 token
     */
    function addSupportedToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        require(!supportedTokens[tokenAddress], "Token already supported");
        
        IERC20 token = IERC20(tokenAddress);
        string memory symbol = token.symbol();
        
        supportedTokens[tokenAddress] = true;
        tokenSymbols[tokenAddress] = symbol;
        tokenList.push(tokenAddress);
        
        emit TokenAdded(tokenAddress, symbol);
    }
    
    /**
     * @dev Remove a supported stablecoin
     * @param tokenAddress Address of the ERC20 token
     */
    function removeSupportedToken(address tokenAddress) external onlyOwner {
        require(supportedTokens[tokenAddress], "Token not supported");
        
        supportedTokens[tokenAddress] = false;
        
        // Remove from tokenList
        for (uint i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == tokenAddress) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        
        emit TokenRemoved(tokenAddress);
    }
    
    /**
     * @dev Pay with any supported stablecoin
     * User must approve this contract to spend their tokens first!
     * @param requestId Unique identifier for the request
     * @param tokenAddress Address of the stablecoin to pay with
     */
    function pay(bytes32 requestId, address tokenAddress) external {
        require(supportedTokens[tokenAddress], "Token not supported");
        require(!payments[requestId].exists, "Request already paid");
        
        IERC20 token = IERC20(tokenAddress);
        
        // Calculate amount based on token decimals
        uint8 decimals = token.decimals();
        uint256 amount = priceUSD * (10 ** decimals) / (10 ** 6);
        
        // Transfer tokens from payer to this contract
        bool success = token.transferFrom(msg.sender, address(this), amount);
        require(success, "Token transfer failed");
        
        payments[requestId] = PaymentRecord({
            payer: msg.sender,
            token: tokenAddress,
            amount: amount,
            timestamp: block.timestamp,
            exists: true
        });
        
        emit PaymentReceived(requestId, msg.sender, tokenAddress, amount, block.timestamp);
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
     * @dev Check if a token is supported
     * @param tokenAddress Token address to check
     * @return bool True if supported
     */
    function isTokenSupported(address tokenAddress) external view returns (bool) {
        return supportedTokens[tokenAddress];
    }
    
    /**
     * @dev Get all supported tokens
     * @return address[] Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }
    
    /**
     * @dev Get supported tokens with symbols
     * @return tokens Array of token addresses
     * @return symbols Array of corresponding symbols
     */
    function getSupportedTokensWithSymbols() external view returns (
        address[] memory tokens,
        string[] memory symbols
    ) {
        uint256 length = tokenList.length;
        tokens = new address[](length);
        symbols = new string[](length);
        
        for (uint256 i = 0; i < length; i++) {
            tokens[i] = tokenList[i];
            symbols[i] = tokenSymbols[tokenList[i]];
        }
        
        return (tokens, symbols);
    }
    
    /**
     * @dev Update the price (owner only)
     * @param newPrice New price in USD (6 decimals)
     */
    function updatePrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = priceUSD;
        priceUSD = newPrice;
        emit PriceUpdated(oldPrice, newPrice);
    }
    
    /**
     * @dev Withdraw specific token balance (owner only)
     * @param tokenAddress Token to withdraw
     */
    function withdraw(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");
        
        bool success = token.transferFrom(address(this), owner, balance);
        require(success, "Withdrawal failed");
        
        emit Withdrawal(tokenAddress, owner, balance);
    }
    
    /**
     * @dev Withdraw all supported tokens (owner only)
     */
    function withdrawAll() external onlyOwner {
        for (uint256 i = 0; i < tokenList.length; i++) {
            IERC20 token = IERC20(tokenList[i]);
            uint256 balance = token.balanceOf(address(this));
            
            if (balance > 0) {
                token.transferFrom(address(this), owner, balance);
                emit Withdrawal(tokenList[i], owner, balance);
            }
        }
    }
    
    /**
     * @dev Get balance of a specific token
     * @param tokenAddress Token to check
     * @return uint256 Balance in token's smallest unit
     */
    function getTokenBalance(address tokenAddress) external view returns (uint256) {
        IERC20 token = IERC20(tokenAddress);
        return token.balanceOf(address(this));
    }
    
    /**
     * @dev Get balances of all supported tokens
     * @return tokens Array of token addresses
     * @return balances Array of corresponding balances
     */
    function getAllBalances() external view returns (
        address[] memory tokens,
        uint256[] memory balances
    ) {
        uint256 length = tokenList.length;
        tokens = new address[](length);
        balances = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            tokens[i] = tokenList[i];
            IERC20 token = IERC20(tokenList[i]);
            balances[i] = token.balanceOf(address(this));
        }
        
        return (tokens, balances);
    }
    
    /**
     * @dev Transfer ownership (owner only)
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner address");
        owner = newOwner;
    }
}
