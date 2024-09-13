package anvil

import (
	"bytes"
	"encoding/json"
	"github.com/gin-gonic/gin"
	"math/big"
	"net/http"
)

func SetBalance(rpc string, address string, balance *big.Int) {
	// Convert the balance to hex string, and pad it to 32 bytes
	balancePadded := balance.Text(16)
	if len(balancePadded)%2 != 0 {
		balancePadded = "0" + balancePadded
	}
	balancePadded = "0x" + balancePadded
	// Set the balance of the address
	body := gin.H{
		"jsonrpc": "2.0",
		"method":  "hardhat_setBalance",
		"params": []interface{}{
			address,
			balancePadded,
		},
		"id": 114514,
	}
	bodySer, _ := json.Marshal(body)
	bodyReader := bytes.NewReader(bodySer)
	r, _ := http.NewRequest("POST", rpc, bodyReader)
	r.Header.Add("Content-Type", "application/json")
	client := http.DefaultClient
	client.Do(r)
}

func SetCode(rpc string, address string, code string) {
	// Set the code of the address
	body := gin.H{
		"jsonrpc": "2.0",
		"method":  "hardhat_setCode",
		"params": []interface{}{
			address,
			code,
		},
		"id": 114514,
	}
	bodySer, _ := json.Marshal(body)
	bodyReader := bytes.NewReader(bodySer)
	r, _ := http.NewRequest("POST", rpc, bodyReader)
	r.Header.Add("Content-Type", "application/json")
	client := http.DefaultClient
	client.Do(r)
}

func Impersonate(rpc string, address string) {
	body := gin.H{
		"jsonrpc": "2.0",
		"method":  "hardhat_impersonateAccount",
		"params": []interface{}{
			address,
		},
		"id": 114514,
	}
	bodySer, _ := json.Marshal(body)
	bodyReader := bytes.NewReader(bodySer)
	r, _ := http.NewRequest("POST", rpc, bodyReader)
	r.Header.Add("Content-Type", "application/json")
	client := http.DefaultClient
	client.Do(r)
}

func StopImpersonate(rpc string, address string) {
	body := gin.H{
		"jsonrpc": "2.0",
		"method":  "hardhat_stopImpersonatingAccount",
		"params": []interface{}{
			address,
		},
		"id": 114514,
	}
	bodySer, _ := json.Marshal(body)
	bodyReader := bytes.NewReader(bodySer)
	r, _ := http.NewRequest("POST", rpc, bodyReader)
	r.Header.Add("Content-Type", "application/json")
	client := http.DefaultClient
	client.Do(r)
}
