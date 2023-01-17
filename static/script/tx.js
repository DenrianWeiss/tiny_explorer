let rpc = "http://192.168.1.100:10085"
let ticker;

async function getRpc() {
    let rpcApi = await fetch("/api/rpc");
    rpc = await rpcApi.text();
}

async function requestResolve() {
    let searchParams = new URLSearchParams(window.location.search);
    let tx = searchParams.get("tx");
    let elem = document.getElementById('tx_resolve');
    ticker = setInterval(() => {
        requestShot(tx, elem)
    }, 1000)
}

async function requestShot(tx, domElement) {
    let resp = await fetch("/api/trace/" + tx, {
        "method": "POST",
    })
    let json = await resp.json()
    // Find status
    let status = json?.status
    if (status == null) {
        domElement.innerHTML = "后端出错"
        clearInterval(ticker);
    } else if (status === 'pending') {
        domElement.innerHTML = "正在解析交易，可能花费最多30秒。"
    } else if (status === 'error_rpc') {
        domElement.innerHTML = "RPC出错"
        clearInterval(ticker);
    } else if (status === 'error_tx' || status === 'pending_tx') {
        domElement.innerHTML = "交易不存在或未完成，确定交易存在的情况下请刷新页面。"
        clearInterval(ticker);
    } else if (status === 'ok') {
        domElement.innerHTML = json.result;
        clearInterval(ticker);
    } else {
        domElement.innerHTML = "未知错误"
        clearInterval(ticker);
    }
}

async function renderTx() {
    await getRpc();
    let searchParams = new URLSearchParams(window.location.search);
    let tx = searchParams.get("tx");
    let provider = new ethers.providers.JsonRpcProvider(rpc);
    let txInstance = await provider.getTransactionReceipt(tx);
    let txInfo = await provider.getTransaction(tx);
    if (txInstance == null) {
        document.getElementById('tx').innerHTML = "交易不存在或未完成，确定交易存在的情况下请刷新页面。"
        return
    }
    document.getElementById('tx').innerHTML = `<h2>交易 #${txInstance.transactionHash}</h2>
        <h4>交易基本信息</h4>
        <ul class="mdui-list">
            <li class="mdui-list-item mdui-ripple" onclick="window.location.href='${"/account.html?address=" + txInfo.from}'">
                <i class="mdui-list-item-icon mdui-icon material-icons">arrow_forward</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">${txInfo.from}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">来源</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple" onclick="window.location.href='${"/account.html?address=" + txInfo.to}'">
                <i class="mdui-list-item-icon mdui-icon material-icons">arrow_back</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">${txInfo.to}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">目标</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">fingerprint</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">${txInstance.transactionHash}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">Hash</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">check</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">${txInstance.status === 1 ? "成功" : "失败"}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">状态</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">grid_on</i>
                <div class="mdui-list-item-content" onclick="window.location='/block.html?block=${txInstance.blockNumber}'">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${txInstance.blockNumber}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">包含区块号</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">format_list_numbered</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${txInstance.transactionIndex}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">区块内交易序号</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">local_gas_station</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${txInstance.gasUsed}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">Gas消耗</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">credit_card</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${txInfo.gasLimit}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">Gas限制</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">assignment</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${txInfo.nonce}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">nonce</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">attach_money</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${txInfo.gasPrice} Wei</div>
                        <div class="mdui-list-item-text mdui-list-item-one-line">Gas价格</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">account_balance_wallet</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${txInstance.effectiveGasPrice} Wei</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">实际gas费用</div>
                </div>
            </li>
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">account_balance</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${txInfo.value} Wei</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">交易价值</div>
                </div>
            </li>
        </ul>
        <h4>交易事件</h4>
        ${renderLogs(txInstance.logs)}
        <!-- event list -->
        <h4>交易数据</h4>
        <code>
            ${txInfo.data}
        </code>
        <h4>交易数据</h4>
        <div class="mdui-container" id="tx_resolve">
            <button class="mdui-btn mdui-ripple" onclick="requestResolve()">请求交易解析</button>
        </div>`
}

function renderLogs(logs) {
    let html = ''
    for (const log of logs) {
        html += renderLog(log)
    }
    return html
}

function renderLog(e) {
    // Filter out erc20 events.
    if (e.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
        return `
        <li class="mdui-list-item">
            <i class="mdui-list-item-icon mdui-icon material-icons">transform</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">转账</div>
                <div class="mdui-list-item-text">
                <span>从 0x${e.topics[1].substring(26)}</span><br/>
                <span>转账 ${e.address}</span><br/>
                <span>至 0x${e.topics[2].substring(26)}</span><br/>
                <span>金额 ${parseInt(e.data)}</span>
                </div>
            </div>
        </li>
    `
    } else {

        let doc = '';
        for (const topic of e.topics) {
            doc += 'Topic:' + topic + '<br/>\n'
        }
        doc += 'Data:' + e.data + '\n'
        return `
        <li class="mdui-list-item mdui-ripple">
            <i class="mdui-list-item-icon mdui-icon material-icons">notifications</i>
            <div class="mdui-list-item-content">
                <div class="mdui-list-item-title mdui-list-item-one-line">事件</div>
                <div class="mdui-list-item-text">
                <code>${doc}</code>
                </div>
            </div>
        </li>
    `
    }
}