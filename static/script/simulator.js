async function renderSimulator() {
    let remoteRunId = await getRemoteRunId()
    let runId = getRunId()
    if (!(remoteRunId === runId)) {
        localStorage.clear()
        localStorage.setItem("run_id", remoteRunId)
    }
    let simulator = getCurrentSimulator()
    if (!simulator) {
        document.getElementById("current_simulator_status").innerText = "Simulator not started"
        document.getElementById("stop").disabled = true
        document.getElementById("extend").disabled = true
    } else {
        refreshTransaction();
        document.getElementById("current_simulator_status").innerText = "Simulator started at path " + simulator
        // Get Page Base URL
        let base = window.location.origin
        document.getElementById("current_simulator_rpc").innerText = base + "/simulations/rpc/" + simulator
        document.getElementById("start").disabled = true
        document.getElementById("stop").disabled = false
        document.getElementById("extend").disabled = false
    }
}

function startSimulator() {
    let simulator = getCurrentSimulator()
    let remoteRpc = document.getElementById("remote_rpc").value
    if (!remoteRpc || remoteRpc === "") {
        alert("Please input remote RPC")
        return
    }
    if (!simulator) {
        // Post /simulations/create
        let data = {
            remoteRpc: remoteRpc
        }
        let reqUri = "/simulations/create"
        fetch(reqUri, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }).then((f) => {
            f.json().then((decoded) => {
                // Check status
                if (decoded.status === "ok") {
                    setCurrentSimulator(decoded.port)
                    alert("Simulator started")
                    let simulator = decoded.port
                    document.getElementById("current_simulator_status").innerText = "Simulator started at path " + simulator
                    // Get Page Base URL
                    let base = window.location.origin
                    document.getElementById("current_simulator_rpc").innerText = base + "/simulations/rpc/" + simulator
                    document.getElementById("start").disabled = true
                    document.getElementById("stop").disabled = false
                    document.getElementById("extend").disabled = false
                } else {
                    alert("Failed to start simulator, " + decoded.detail)
                }
            })
        })
    } else {
        alert("Simulator already started")
    }
}

function stopSimulator() {
    let port = getCurrentSimulator()
    if (!port) {
        alert("Simulator not started")
        return
    }
    // Post /simulations/stop
    let reqUri = "/simulations/kill"
    fetch(reqUri, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({port: port})
    }).then((f) => {
        f.json().then((decoded) => {
            // Check status
            if (decoded.status === "ok") {
                setCurrentSimulator(null)
                alert("Simulator stopped")
            } else {
                alert("Failed to stop simulator, " + decoded.detail)
            }
        })
    })
}

function extendSimulator() {
    let port = getCurrentSimulator()
    if (!port) {
        alert("Simulator not started")
        return
    }
    // Post /simulations/stop
    let reqUri = "/simulations/extend"
    fetch(reqUri, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({port: port})
    }).then((f) => {
        f.json().then((decoded) => {
            // Check status
            if (decoded.status === "ok") {
                setCurrentSimulator(null)
                alert("Simulator stopped")
            } else {
                alert("Failed to stop simulator, " + decoded.detail)
            }
        })
    })
}

function sendTransaction() {
    let from = document.getElementById("from").value
    let to = document.getElementById("to").value
    let value = document.getElementById("amount").value
    let data = document.getElementById("data").value
    // Post /simulations/simulate
    let req = {
        "port": parseInt(getCurrentSimulator()),
        "from": from,
        "to": to,
        "value": value,
        "data": data,
    }
    let reqUri = "/simulations/simulate"
    fetch(reqUri, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(req)
    }).then((f) => {
        f.json().then((decoded) => {
            // Check status
            if (decoded.status === "ok") {
                if (decoded.resp) {
                    // Redirect to /simulations/tx.html?port=${port}&tx=${resp}
                    window.location.href = "/simulations/tx.html?port=" + req.port + "&tx=" + decoded.resp
                }
            } else {
                alert("Failed to send transaction, " + decoded.detail)
            }
        })
    })
}

async function getRemoteRunId() {
    // Get /api/run_id
    let resp = await fetch("/api/run_id")
    let j = await resp.json()
    return j.run_id
}

function getRunId() {
    return localStorage.getItem("run_id")
}

function getCurrentSimulator() {
    // Read "simulator" from local storage
    let simulator = localStorage.getItem("simulator")
    if (!simulator) {
        return null
    }
    return simulator.toString()
}

function setCurrentSimulator(simulator) {
    localStorage.setItem("simulator", simulator)
}

function renderTx(tx) {
    return `
    <li class="mdui-list-item mdui-ripple" onclick="window.location='/simulations/tx.html?tx=${tx.hash}&port=${getCurrentSimulator()}'">
      <i class="mdui-list-item-icon mdui-icon material-icons">swap_horiz</i>
      <div class="mdui-list-item-content">
        <div class="mdui-list-item-title mdui-list-item-one-line">Tx ${tx.hash}</div>
        <div class="mdui-list-item-text mdui-list-item-two-line">
          <span>Sender: ${tx.from}</span>
          <br/>
          <span>Receiver: ${tx.to}</span>
        </div>
      </div>
    </li>
    `
}

function renderBlock(block) {
    return `
    <li class="mdui-list-item mdui-ripple">
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

async function refreshTransaction() {
    let simulator = getCurrentSimulator()
    if (!simulator) {
        alert("Simulator not started")
        return
    }
    let rpc = window.location.origin + "/simulations/rpc/" + simulator
    let provider = new ethers.providers.JsonRpcProvider(rpc);
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