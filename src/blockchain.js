/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

  /**
   * Constructor of the class, you will need to setup your chain array and the height
   * of your chain (the length of your chain array).
   * Also everytime you create a Blockchain class you will need to initialized the chain creating
   * the Genesis Block.
   * The methods in this class will always return a Promise to allow client applications or
   * other backends to call asynchronous functions.
   */
  constructor() {
    this.chain = [];
    this.height = -1;
    this.initializeChain();
  }

  /**
   * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
   * You should use the `addBlock(block)` to create the Genesis Block
   * Passing as a data `{data: 'Genesis Block'}`
   */
  async initializeChain() {
    if (this.height === -1) {
      let block = new BlockClass.Block({data: 'Genesis Block'});
      await this._addBlock(block);
    }
  }

  /**
   * Utility method that return a Promise that will resolve with the height of the chain
   */
  getChainHeight() {
    return new Promise((resolve) => {
      resolve(this.height);
    });
  }

  /**
   * _addBlock(block) will store a block in the chain
   * @param {*} block
   * The method will return a Promise that will resolve with the block added
   * or reject if an error happen during the execution.
   * You will need to check for the height to assign the `previousBlockHash`,
   * assign the `timestamp` and the correct `height`...At the end you need to
   * create the `block hash` and push the block into the chain array. Don't for get
   * to update the `this.height`
   * Note: the symbol `_` in the method name indicates in the javascript convention
   * that this method is a private method.
   */
  _addBlock(block) {
    let self = this;
    return new Promise(async (resolve, reject) => {
      // Assign the height to the block
      block.height = this.chain.length

      // Assign the timestamp to the block
      block.time = new Date().getTime().toString().slice(0, -3);

      // Assign the "previousBlockHash" by checking the "height"
      if (block.height > 0) {
        block.previousBlockHash = this.chain[block.height - 1].hash
      }

      // Create the `block hash`
      block.hash = SHA256(JSON.stringify(block)).toString();

      // Validate the chain
      const errors = await self.validateChain();

      if (block.hash && errors.length === 0) {
        // Push the block into the chain array
        self.chain.push(block);

        // Incremented the height
        self.height++;
        resolve(block);
      } else {
        reject(new Error(`Add block failed!!`))
      }
    });
  }

  /**
   * The requestMessageOwnershipVerification(address) method
   * will allow you  to request a message that you will use to
   * sign it with your Bitcoin Wallet (Ethereum or Bitcoin Core)
   * This is the first step before submit your Block.
   * The method return a Promise that will resolve with the message to be signed
   * @param {*} address
   */
  requestMessageOwnershipVerification(address) {
    console.log(address)
    return new Promise((resolve) => {
      // <WALLET_ADDRESS>:${new Date().getTime().toString().slice(0,-3)}:starRegistry
      const messageToBeSigned = `${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`
      resolve(messageToBeSigned);
    });
  }

  /**
   * The submitStar(address, message, signature, star) method
   * will allow users to register a new Block with the star object
   * into the chain. This method will resolve with the Block added or
   * reject with an error.
   * Algorithm steps:
   * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
   * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
   * 3. Check if the time elapsed is less than 5 minutes
   * 4. Verify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
   * 5. Create the block and add it to the chain
   * 6. Resolve with the block added.
   * @param {*} address
   * @param {*} message
   * @param {*} signature
   * @param {*} star
   */
  submitStar(address, message, signature, star) {
    console.log(`submitStar`)
    console.log(`address: ${address} \n message: ${message} \n signature: ${signature} \n star: ${star}`);
    return new Promise(async (resolve, reject) => {
      const timeFromMessageSent = parseInt(message.split(':')[1])
      console.log(`timeFromMessageSent = ${timeFromMessageSent}`);

      let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
      console.log(`currentTime = ${currentTime}`);

      // Check if the time elapsed is less than 5 minutes (compare the time in the message and currentTime)
      const timeLapseAllowed = 5 * 60; // 5 minutes
      console.log(`Allowed Time Lapse = ${timeLapseAllowed}`);
      const timeElapsed = currentTime - timeFromMessageSent;
      console.log(`timeElapsed = ${timeElapsed}`);

      if (timeElapsed > timeLapseAllowed) {
        reject(new Error('The time from which message sent is greater than 5 minutes!'));
      }

      // Verify the message with wallet address and signature:
      const bitcoinMessageValid = bitcoinMessage.verify(message, address, signature);
      if (!bitcoinMessageValid) {
        reject(new Error('Validation Failure!! The message with wallet address and signature!'));
      }

      // Create the block and add it to the chain
      // Resolve with the block added.
      try {
        const newBlock = new BlockClass.Block({star: star, owner: address});
        console.log(`newBlock = ${newBlock}`);
        const newBlockAddResponse = await this._addBlock(newBlock);
        console.log(`newBlockAddResponse = ${newBlockAddResponse}`);
        resolve(newBlockAddResponse)
      } catch (err) {
        console.log(`newBlock err = ${err}`);
        reject(new Error(`Block add failed!`))
      }
    });
  }

  /**
   * This method will return a Promise that will resolve with the Block
   *  with the hash passed as a parameter.
   * Search on the chain array for the block that has the hash.
   * @param {*} hash
   */
  getBlockByHash(hash) {
    console.log(`getBlockByHash`)
    console.log(`hash: ${hash}`)
    let self = this;
    return new Promise((resolve, reject) => {
      // Search on the chain array for the block that has the hash.
      const searchedBlock = self.chain.find(blockToFind => hash === blockToFind.hash);
      console.log(`searchedBlock: ${searchedBlock}`)
      if (!searchedBlock) {
        reject(new Error(`Could not find the block with hash: ${hash}!`));
      }
      resolve(searchedBlock);
    });
  }

  /**
   * This method will return a Promise that will resolve with the Block object
   * with the height equal to the parameter `height`
   * @param {*} height
   */
  getBlockByHeight(height) {
    let self = this;
    return new Promise((resolve, reject) => {
      let block = self.chain.filter(p => p.height === height)[0];
      if (block) {
        resolve(block);
      } else {
        reject(null);
      }
    });
  }

  /**
   * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
   * and are belongs to the owner with the wallet address passed as parameter.
   * Remember the star should be returned decoded.
   * @param {*} address
   */
  getStarsByWalletAddress(address) {
    let self = this;
    let stars = [];
    return new Promise((resolve, reject) => {
      self.chain.forEach(async (block) => {
        console.log(block)
        const blockData = await block.getBData();
        console.log(`blockData: ${blockData}`)
        if (blockData.owner === address) {
          stars.push(blockData)
        }
      })

      if (!!stars.length) {
        reject(`No stars existed in the chain for the owner! `)
      } else {
        resolve(stars);
      }
    });
  }

  /**
   * This method will return a Promise that will resolve with the list of errors when validating the chain.
   * Steps to validate:
   * 1. You should validate each block using `validateBlock`
   * 2. Each Block should check the with the previousBlockHash
   */
  validateChain() {
    let self = this;
    let errorLog = [];
    return new Promise(async (resolve) => {
      self.chain.forEach(block => {
        const isBlockValid = block.validate();
        console.log(`isBlockValid: ${isBlockValid}`);

        if (!isBlockValid) {
          errorLog.push(new Error(`The previous block's hash does not match the current block with height ${block.height}`))
        }
      });
      resolve(errorLog);
    });
  }

}

module.exports.Blockchain = Blockchain;   