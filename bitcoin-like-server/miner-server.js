const WebSocket = require('ws');
const crypto = require('crypto');

const ws = new WebSocket('ws://localhost:8080');

let blockchain = [];
const difficulty = 3;

function createGenesisBlock() {
    return {
        index: 0,
        timestamp: new Date(),
        data: "Genesis Block",
        previousHash: "0",
        nonce: 0,
        hash: calculateHash(0, new Date(), "Genesis Block", "0", 0)
    };
}

function calculateHash(index, timestamp, data, previousHash, nonce) {
    return crypto.createHash('sha256').update(index + timestamp + data + previousHash + nonce).digest('hex');
}

function proofOfWork(index, timestamp, data, previousHash) {
    let nonce = 0;
    let hash;
    do {
        nonce++;
        hash = calculateHash(index, timestamp, data, previousHash, nonce);
    } while (hash.substring(0, difficulty) !== Array(difficulty + 1).join("0"));
    return { nonce, hash };
}

function addBlock(data) {
    const lastBlock = blockchain[blockchain.length - 1];
    const newBlockIndex = lastBlock.index + 1;
    const newBlockTimestamp = new Date();
    const { nonce, hash } = proofOfWork(newBlockIndex, newBlockTimestamp, data, lastBlock.hash);
    const newBlock = {
        index: newBlockIndex,
        timestamp: newBlockTimestamp,
        data: data,
        previousHash: lastBlock.hash,
        nonce: nonce,
        hash: hash
    };
    blockchain.push(newBlock);
    return newBlock;
}

ws.on('open', () => {
    console.log('Connected to the central server.');
    blockchain.push(createGenesisBlock());
    console.log('Genesis Block created:', blockchain[0]);

    setTimeout(() => {
        const newBlock = addBlock('Some transaction data');
        console.log('New Block mined:', newBlock);
        ws.send(JSON.stringify(newBlock));
    }, 5000);
});

ws.on('message', (message) => {
    const block = JSON.parse(message);
    console.log('Received block from central server:', block);
    if (isValidBlock(block, blockchain[blockchain.length - 1])) {
        blockchain.push(block);
        console.log('Block added to the blockchain:', block);
    } else {
        console.log('Received an invalid block. Rejected.');
    }
});

function isValidBlock(newBlock, previousBlock) {
    console.log("Previous Block Hash:", previousBlock.hash);
    console.log("New Block Previous Hash:", newBlock.previousHash);
    console.log("New Block Calculated Hash:", calculateHash(newBlock.index, newBlock.timestamp, newBlock.data, newBlock.previousHash, newBlock.nonce));
    console.log("New Block Provided Hash:", newBlock.hash);

    if (newBlock.index !== previousBlock.index + 1) {
        console.log('Invalid index');
        return false;
    }
    if (newBlock.previousHash !== previousBlock.hash) {
        console.log('Previous hash does not match');
        return false;
    }
    if (newBlock.hash !== calculateHash(newBlock.index, newBlock.timestamp, newBlock.data, newBlock.previousHash, newBlock.nonce)) {
        console.log('Hash does not match');
        return false;
    }
    return true;
}
