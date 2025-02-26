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