let main = "http://192.168.1.100:10085"

async function getRpc() {
    let rpcApi = await fetch("/api/rpc");
    main = await rpcApi.text();
}

async function renderMainPage() {
    await getRpc();
    let provider = new ethers.providers.JsonRpcProvider(main);
    // Render Main Page
    let blocks = [];
    let latestBlock = await provider.getBlockNumber();
    for (let i = 0; i < 5; i++) {
        try {
            let block = await provider.getBlock(latestBlock - i);
            if (block == null) {
                continue;
            }
            blocks.push(block);
        } catch (e) {
            console.log(e);
            break;
        }
    }
    let txs = [];
    let blockCount = 0;
    for (let block of blocks) {
        for (let tx of block.transactions) {
            txs.push(tx);
            blockCount++;
            if (blockCount >= 5) {
                break;
            }
        }
    }
    // Render Blocks
    let renderedBlocks = "";
    for (let block of blocks) {
        renderedBlocks += renderBlock(block);
    }
    document.getElementById('block_list').innerHTML = `
    <h3 class="mdui-typo">最近区块</h3>
    <ul class="mdui-list">
      ${renderedBlocks}
    </ul>
    `;
    let renderedTxs = "";
    for (let tx of txs) {
        let txInstance = await provider.getTransaction(tx);
        if (tx == null) {
            continue;
        }
        renderedTxs += renderTx(txInstance);
    }
    document.getElementById('tx_list').innerHTML = `
    <h3 class="mdui-typo">最近交易</h3>
    <ul class="mdui-list">
        ${renderedTxs}
    </ul>
    `;
}

function renderBlock(block) {
    return `
    <li class="mdui-list-item mdui-ripple" onclick="window.location='block.html?block=${block.number}'">
      <i class="mdui-list-item-icon mdui-icon material-icons">blur_circular</i>
      <div class="mdui-list-item-content">
        <div class="mdui-list-item-title mdui-list-item-one-line">Block #${block.number}</div>
        <div class="mdui-list-item-text mdui-list-item-two-line">
          <span>Timestamp: ${(new Date(block.timestamp * 1000)).toLocaleString()}</span>
          <span>    </span>
          <span>Transaction Count: ${block.transactions.length}</span><br/>
          <span>Hash: ${block.hash.slice(0, 32)}</span>
        </div>
      </div>
    </li>
    `;
}

function renderTx(tx) {
    return `
    <li class="mdui-list-item mdui-ripple" onclick="window.location='tx.html?tx=${tx.hash}'">
      <i class="mdui-list-item-icon mdui-icon material-icons">swap_horiz</i>
      <div class="mdui-list-item-content">
        <div class="mdui-list-item-title mdui-list-item-one-line">Tx ${tx.hash.slice(0, 32)}</div>
        <div class="mdui-list-item-text mdui-list-item-two-line">
          <span>Sender: ${tx.from}</span>
          <br/>
          <span>Receiver: ${tx.to}</span>
        </div>
      </div>
    </li>
    `
}

function startSimulator() {
    window.location = "simulator.html";
}