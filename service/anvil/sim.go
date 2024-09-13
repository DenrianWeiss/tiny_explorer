package anvil

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gin-gonic/gin"
	"io"
	"math/big"
	"net/http"
	"strconv"
)

type SendTxResp struct {
	Id      int    `json:"id"`
	Jsonrpc string `json:"jsonrpc"`
	Result  string `json:"result"`
}

func Simulate(port int, from string, to string, value string, data string) (string, error) {
	// Simulate the transaction
	/// First using go-ethereum to get code from `from` address.
	rpc := "http://localhost:" + strconv.Itoa(port)
	rpcInstance, err := ethclient.Dial(rpc)
	if err != nil {
		return "", err
	}
	codeCache, err := rpcInstance.CodeAt(context.TODO(), common.HexToAddress(from), nil)
	// If the code is 0x, skip recovering the account, otherwise clean it's code.
	if len(codeCache) == 0 {
		defer SetCode(rpc, from, fmt.Sprintf("0x%x", codeCache))
	}
	prevBalance, err := rpcInstance.BalanceAt(context.TODO(), common.HexToAddress(from), nil)
	// Set the balance of the `from` address to 1e18
	balanceString := "1000000000000000000"
	balance, _ := new(big.Int).SetString(balanceString, 10)
	SetBalance(rpc, from, balance)
	// Recover balance after simulation
	defer SetBalance(rpc, from, prevBalance)
	// Impersonate the `from` address
	Impersonate(rpc, from)
	defer StopImpersonate(rpc, from)
	// Call eth_sendTransaction
	body := gin.H{
		"jsonrpc": "2.0",
		"method":  "eth_sendTransaction",
		"params": []interface{}{
			gin.H{
				"from":  from,
				"to":    to,
				"value": value,
				"data":  data,
			},
		},
		"id": 114514,
	}
	// Send the transaction
	bodySer, _ := json.Marshal(body)
	bodyReader := bytes.NewReader(bodySer)
	r, _ := http.NewRequest("POST", rpc, bodyReader)
	r.Header.Add("Content-Type", "application/json")
	client := http.DefaultClient
	resp, err := client.Do(r)
	if err != nil {
		return "", err
	}
	// Handle the response, bind it to SendTxResp
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	var sendTxResp SendTxResp
	err = json.Unmarshal(respBody, &sendTxResp)
	if err != nil {
		return "", err
	}
	if sendTxResp.Result == "" {
		return "", fmt.Errorf("error: %s", string(respBody))
	}
	return sendTxResp.Result, nil
}
