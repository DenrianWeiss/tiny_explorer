let rpc = "http://192.168.1.100:10085"

async function getRpc() {
    let rpcApi = await fetch("/api/rpc");
    rpc = await rpcApi.text();
}

async function getCustomToken() {
    let rpcApi = await fetch("/api/tokens/list");
    let tokens = await rpcApi.json();
    return tokens;
}

let chainIdToAddress = {
    1: {
        "WETH": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "USDT": "0xdac17f958d2ee523a2206206994597c13d831ec7",
        "USDC": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        "WBTC": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        "stETH": "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
        "Aave Debt Variable ETH": "0x4e977830ba4bd783C0BB7F15d3e243f73FF57121",
        "Aave stETH": "0x1982b2F5814301d4e9a8b0201555376e62F82428",
        "AaveV3 Coll wstETH": "0x0B925eD163218f6662a35e0f0371Ac234f9E9371",
        "AaveV3 Debt Variable ETH": "0xeA51d7853EEFb32b6ee06b1C12E6dcCA88Be0fFE"
    }, 137: {
        "WMATIC": "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
        "MATICX": "0xfa68fb4628dff1028cfec22b4162fccd0d45efb6",
        "Stader": "0x1d734a02ef1e1f5886e66b0673b71af5b53ffa94",
        "Aave Debt Variable Matic": "0x4a1c3aD6Ed28a636ee1751C69071f6be75DEb8B8",
        "Aave MaticX": "0x80cA0d8C38d2e2BcbaB66aA1648Bd1C7160500FE",
    }, 43114: {
        "qiBTC.b": "0x89a415b3D20098E6A6C8f7a59001C67BD3129821"
    }
}

async function getTransactionList(address) {
    let txListApi = await fetch("/api/txs/" + address);
    let txList = await txListApi.json();
    // Parse txList
    // render table row
    let txListInSeg = ""
    let txListOutSeg = ""
    let inTxList = txList?.in ?? []
    for (const inTx of inTxList) {
        txListInSeg += `<tr onclick="toTxPage(${inTx.hash})"> <!--TODO: toTxPage-->
            <td>${inTx.hash}</td>
            <td>${inTx.block}</td>
            <td>${inTx.from}</td>
            <td>${inTx.to}</td>
            <td>${inTx.value}</td>
        </tr>`
    }
    let outTxList = txList?.out ?? []
    for (const outTx of outTxList) {
        txListOutSeg += `<tr onclick="toTxPage(${outTx.hash})">
            <td>${outTx.hash}</td>
            <td>${outTx.block}</td>
            <td>${outTx.from}</td>
            <td>${outTx.to == "" ? "合约创建": outTx.to}</td>
            <td>${outTx.value}</td>
        </tr>`
    }
    // Assemble seg
    return `<div class="mdui-typo">
            <p5>发出交易</p5>
                <div class="mdui-table-fluid">
                    <table class="mdui-table">
                        <thead>
                        <tr>
                            <th>交易ID</th>
                            <th>区块号</th>
                            <th>时间</th>
                            <th>发出地址</th>
                            <th>接收地址</th>
                            <th>金额</th>
                        </tr>
                        </thead>
                        <tbody>
                        ${txListInSeg}
                        </tbody>
                    </table>
                </div>
        <p5>收到交易</p5>
                <div class="mdui-table-fluid">
                    <table class="mdui-table">
                        <thead>
                        <tr>
                            <th>交易ID</th>
                            <th>区块号</th>
                            <th>发出地址</th>
                            <th>接收地址</th>
                            <th>金额</th>
                        </tr>
                        </thead>
                        <tbody>
                        ${txListOutSeg}
                        </tbody>
                    </table>
                <!--                    <div class="mdui-panel-item-actions">-->
                <!--                        <button class="mdui-btn mdui-ripple" onclick="refreshTransaction()">刷新</button>-->
                <!--                    </div>-->
                </div>
    </div>`

}

async function refreshTokenBalance() {
    document.getElementById('balanceList').innerHTML = ""
    let searchParams = new URLSearchParams(window.location.search);
    let address = searchParams.get("address");
    let provider = new ethers.providers.JsonRpcProvider(rpc);
    let chainId = (await provider.getNetwork()).chainId;
    let hardCode = chainIdToAddress[chainId];
    let customToken = await getCustomToken();
    let addressList = new Map([...Object.entries(hardCode), ...Object.entries(customToken)]);
    // noinspection ES6MissingAwait
    addressList.forEach(async (value, key) => {
        await renderToken(key, value, address, (n, b) => {
            document.getElementById('balanceList').innerHTML += `<tr><td>${n}</td><td>${b}</td></tr>`
            mdui.mutation()
        });
    });
}

async function renderAccountPage() {
    await getRpc()
    let searchParams = new URLSearchParams(window.location.search);
    let address = searchParams.get("address");
    if (!validEthereumAddress(address)) {
        document.getElementById("account").innerText = "账号不合法";
        return
    }
    let provider = new ethers.providers.JsonRpcProvider(rpc);
    let balance = await provider.getBalance(address);
    let balanceEth = ethers.utils.formatEther(balance);
    let code = await provider.getCode(address, "latest");
    let isContract = code !== "0x";
    let codeSeg = !isContract ? "" : `<h4>合约代码</h4>
        <div class="mdui-typo mdui-container">
            <code>${code}</code>
        </div>`
    let txCount = 0;
    if (!isContract) {
        txCount = await provider.getTransactionCount(address, "latest");
    }
    let txCountSeg = isContract ? "" : `<li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">format_list_numbered</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${txCount}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">交易计数</div>
                </div>
            </li>`
    document.getElementById("account").innerHTML = `<h2>账号 ${address}</h2>
        <h4>账号信息</h4>
        <ul class="mdui-list">
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">code</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title">${!isContract ? "外部地址" : "合约"}</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">类别</div>
                </div>
            </li>
            ${txCountSeg}
            <li class="mdui-list-item mdui-ripple">
                <i class="mdui-list-item-icon mdui-icon material-icons">credit_card</i>
                <div class="mdui-list-item-content">
                    <div class="mdui-list-item-title mdui-list-item-one-line">${balanceEth} ETH</div>
                    <div class="mdui-list-item-text mdui-list-item-one-line">余额</div>
                </div>
            </li>
        </ul>
        <h4>交易记录</h4>
        ${await getTransactionList(address)}
        <h4>代币余额</h4>
        <div class="mdui-table-fluid">
            <table class="mdui-table">
                <thead>
                <tr>
                    <th>代币</th>
                    <th>原始余额</th>
                </tr>
                </thead>
                <tbody id="balanceList">
                         
                </tbody>
            </table>
        </div>
        <div>
            <button class="mdui-btn mdui-ripple" onclick="refreshTokenBalance()">刷新</button>
        </div>  
        <!--<h5>查询指定代币余额</h5>
        <div class="mdui-container">
            <div class="mdui-textfield mdui-col-xs-10 mdui-col-lg-6">
                <input class="mdui-textfield-input" type="text" name="token" placeholder="代币地址"/>
            </div>
            <button class="mdui-btn mdui-btn-raised mdui-ripple mdui-color-theme-accent mdui-col-xs-2 mdui-col-lg-1"
                    onclick="queryTokenBalance()">查询
            </button>
        </div>-->
        ${codeSeg}
`;
    // Invoke RenderToken async
    await refreshTokenBalance()
}

function validEthereumAddress(address) {
    return /^(0x)?[0-9a-fA-F]{40}$/i.test(address);
}

async function renderToken(name, tokenAddress, userAddress, renderFunc) {
    let provider = new ethers.providers.JsonRpcProvider(rpc);
    let token = new ethers.Contract(tokenAddress, erc20Abi, provider);
    let balance = await token.balanceOf(userAddress);
    let decimals = await token.decimals();
    await renderFunc(name, balance / Math.pow(10, decimals));
}