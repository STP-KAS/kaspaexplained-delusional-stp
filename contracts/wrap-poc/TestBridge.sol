// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Disposable test assets only. The vault trusts its configured oracle to verify Kaspa burns.
contract MockUSD {
    string public constant name = "Pixie Test USD";
    string public constant symbol = "pUSD";
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public claimed;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function faucet() external {
        require(!claimed[msg.sender], "Already claimed");
        claimed[msg.sender] = true;
        uint256 amount = 100 * 10 ** uint256(decimals);
        totalSupply += amount;
        balanceOf[msg.sender] += amount;
        emit Transfer(address(0), msg.sender, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        uint256 permitted = allowance[sender][msg.sender];
        require(permitted >= amount, "Insufficient allowance");
        if (permitted != type(uint256).max) {
            allowance[sender][msg.sender] = permitted - amount;
            emit Approval(sender, msg.sender, permitted - amount);
        }
        _transfer(sender, recipient, amount);
        return true;
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(recipient != address(0), "Zero recipient");
        require(balanceOf[sender] >= amount, "Insufficient balance");
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }
}

interface TestToken {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract TestVault {
    address public immutable token;
    address public immutable oracle;
    struct Deposit {
        address depositor;
        uint256 amount;
        bytes32 kaspaRecipient;
        bool released;
    }
    mapping(bytes32 => Deposit) public deposits;
    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public usedBurnIds;
    bool private entered;
    event Deposited(bytes32 indexed depositId, address indexed depositor, uint256 amount, bytes32 kaspaRecipient);
    event Released(bytes32 indexed depositId, address indexed recipient, bytes32 indexed kaspaBurnId, uint256 amount);

    constructor(address asset, address trustedOracle) {
        require(asset.code.length != 0, "Token must be a contract");
        require(trustedOracle != address(0), "Zero oracle");
        token = asset;
        oracle = trustedOracle;
    }

    modifier nonReentrant() {
        require(!entered, "Reentrant call");
        entered = true;
        _;
        entered = false;
    }

    function deposit(uint256 amount, bytes32 kaspaRecipient) external nonReentrant returns (bytes32 depositId) {
        require(amount != 0, "Zero amount");
        require(kaspaRecipient != bytes32(0), "Zero recipient");
        uint256 nonce = nonces[msg.sender]++;
        depositId = keccak256(abi.encode(block.chainid, address(this), msg.sender, nonce, amount, kaspaRecipient));
        require(deposits[depositId].depositor == address(0), "Duplicate deposit");
        uint256 beforeBalance = TestToken(token).balanceOf(address(this));
        _callToken(abi.encodeCall(TestToken.transferFrom, (msg.sender, address(this), amount)));
        require(TestToken(token).balanceOf(address(this)) == beforeBalance + amount, "Inexact backing");
        deposits[depositId] = Deposit(msg.sender, amount, kaspaRecipient, false);
        emit Deposited(depositId, msg.sender, amount, kaspaRecipient);
    }

    function release(bytes32 depositId, address recipient, bytes32 kaspaBurnId) external nonReentrant {
        require(msg.sender == oracle, "Only oracle");
        require(recipient != address(0) && recipient != address(this), "Invalid recipient");
        require(kaspaBurnId != bytes32(0), "Zero burn ID");
        Deposit storage item = deposits[depositId];
        require(item.depositor != address(0), "Unknown deposit");
        require(!item.released, "Already released");
        require(!usedBurnIds[kaspaBurnId], "Burn already used");
        item.released = true;
        usedBurnIds[kaspaBurnId] = true;
        uint256 beforeBalance = TestToken(token).balanceOf(address(this));
        uint256 recipientBefore = TestToken(token).balanceOf(recipient);
        _callToken(abi.encodeCall(TestToken.transfer, (recipient, item.amount)));
        require(TestToken(token).balanceOf(address(this)) + item.amount == beforeBalance, "Inexact debit");
        require(TestToken(token).balanceOf(recipient) == recipientBefore + item.amount, "Inexact payout");
        emit Released(depositId, recipient, kaspaBurnId, item.amount);
    }

    function _callToken(bytes memory data) private {
        (bool success, bytes memory result) = token.call(data);
        require(success && (result.length == 0 || (result.length == 32 && abi.decode(result, (bool)))), "Token transfer failed");
    }
}
