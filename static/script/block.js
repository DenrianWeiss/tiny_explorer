function renderTxCard(tx) {
    return `<li class="mdui-list-item mdui-ripple"  onclick="window.location='tx.html?tx=${tx.hash}'">
        <i class="mdui-list-item-icon mdui-icon material-icons">swap_horiz</i>
        <div class="mdui-list-item-content">
            <div class="mdui-list-item-title">交易
                ${tx.hash}
            </div>
            <div class="mdui-list-item-text">
                <span><b>Hash</b> ${tx.hash}</span><br/>
                <span><b>来源</b> ${tx.from}</span><br/>
                <span><b>目标</b> ${tx.to}</span><br/>
                <span><b>金额</b> ${tx.value / 1e18} wei   <b>Nonce</b> ${tx.nonce}</span>
            </div>
        </div>
    </li>`
}

function renderBlockInfo(blockWithTx) {
    let renderedTx = "";
    for (const tx of blockWithTx.transactions) {
        renderedTx += renderTxCard(tx);
    }
    return `<h2>区块 #${blockWithTx.number}</h2>
        <h4>区块信息</h4>
        <ul class="mdui-list">
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">grid_on</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${blockWithTx.number}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">区块号</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">fingerprint</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">${blockWithTx.hash}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">Hash</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">access_time</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">${(new Date(blockWithTx.timestamp * 1000)).toLocaleString('zh-CN')} - ${blockWithTx.timestamp}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">时间戳</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">format_list_numbered</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${blockWithTx.transactions.length}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">交易计数</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">local_gas_station</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${blockWithTx.gasUsed}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">Gas消耗</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">credit_card</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${blockWithTx.gasLimit}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">Gas限制</div>
                </div>
            </li>
        </ul>
        <h4>交易信息</h4>
        <ul class="mdui-list">
            ${renderedTx}
        </ul>`
}

let rpc = "http://192.168.1.100:10085"

async function getRpc() {
    let rpcApi = await fetch("/api/rpc");
    rpc = await rpcApi.text();
}

async function renderBlockPage() {
    await getRpc()
    let searchParams = new URLSearchParams(window.location.search);
    let blockNumber = searchParams.get("block");
    let n = parseInt(blockNumber);
    if (Number.isNaN(n)) {
        document.getElementById("block").innerHTML = "区块号无效";
    } else {
        let provider = new ethers.providers.JsonRpcProvider(rpc);
        let block = await provider.getBlockWithTransactions(n);
        if (block === null) {
            document.getElementById("block").innerHTML = "区块不存在";
        }
        document.getElementById("block").innerHTML = renderBlockInfo(block);
    }
}