package indexer

import (
	"bytes"
	"context"
	"encoding/json"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"io"
	"log"
	"math/big"
	"net/http"
	"resolver_explorer/config"
	"resolver_explorer/service/env"
	"resolver_explorer/service/ethereum"
	"strings"
)

var TransferEventHash = common.HexToHash("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")

type TxSummary struct {
	From  string `json:"from"`
	To    string `json:"to"`
	Value string `json:"value"`
	Hash  string `json:"hash"`
	Block string `json:"block"`
	Seq   string `json:"seq"`
	Nonce string `json:"nonce"`
}

type GetTxRequest struct {
	Id      string   `json:"id"`
	Jsonrpc string   `json:"jsonrpc"`
	Params  []string `json:"params"`
	Method  string   `json:"method"`
}

type GetTxResponse struct {
	Jsonrpc string      `json:"jsonrpc"`
	Id      interface{} `json:"id"`
	Result  struct {
		BlockHash        string `json:"blockHash"`
		BlockNumber      string `json:"blockNumber"`
		Hash             string `json:"hash"`
		From             string `json:"from"`
		Gas              string `json:"gas"`
		GasPrice         string `json:"gasPrice"`
		Input            string `json:"input"`
		Nonce            string `json:"nonce"`
		R                string `json:"r"`
		S                string `json:"s"`
		To               string `json:"to"`
		TransactionIndex string `json:"transactionIndex"`
		Type             string `json:"type"`
		V                string `json:"v"`
		Value            string `json:"value"`
	} `json:"result"`
}

var TxOutRecord = make(map[string][]TxSummary)
var TxInRecord = make(map[string][]TxSummary)
var TokenRecord = make(map[string]map[string]bool)

func InsertTxOutForAddress(address string, txS TxSummary) {
	if _, ok := TxOutRecord[strings.ToLower(address)]; ok {
		TxOutRecord[strings.ToLower(address)] = append(TxOutRecord[strings.ToLower(address)], txS)
	} else {
		TxOutRecord[strings.ToLower(address)] = []TxSummary{txS}
	}
}

func InsertTxInForAddress(address string, txS TxSummary) {
	if _, ok := TxInRecord[strings.ToLower(address)]; ok {
		TxInRecord[strings.ToLower(address)] = append(TxInRecord[strings.ToLower(address)], txS)
	} else {
		TxInRecord[strings.ToLower(address)] = []TxSummary{txS}
	}
}

func InsertTokenForAddress(address string, token string) {
	if v, ok := TokenRecord[strings.ToLower(address)]; ok && v != nil {
		TokenRecord[strings.ToLower(address)][strings.ToLower(token)] = true
	} else {
		TokenRecord[strings.ToLower(address)] = map[string]bool{token: true}
	}
}

func InitIndexer() {
	ethereum.InitConnect()
	if env.GetIndexerStartBlock() == "" {
		log.Println("Indexer is disabled")
	}
	blockNumber, err := ethereum.GetClient().BlockNumber(context.Background())
	if err != nil {
		log.Println("Failed to get block number")
	}
	go BlockHeadListener()
	startBlock, _ := big.NewInt(0).SetString(env.GetIndexerStartBlock(), 10)
	if startBlock.Cmp(big.NewInt(0)) == 0 {
		log.Println("Indexer is disabled")
		return
	}
	ScanBackJob(startBlock.Int64(), int64(blockNumber))
}

func GetTxWithJsonRpc(hash string) *GetTxResponse {
	// Call eth_getTransactionByHash
	body, _ := json.Marshal(GetTxRequest{
		Id:      "dontcare",
		Jsonrpc: "2.0",
		Params:  []string{hash},
		Method:  "eth_getTransactionByHash",
	})

	post, err := http.Post(config.GetHttpRpc(), "application/json", bytes.NewReader(body))
	if err != nil {
		return nil
	}
	all, err := io.ReadAll(post.Body)
	if err != nil {
		return nil
	}
	result := GetTxResponse{}
	err = json.Unmarshal(all, &result)
	if err != nil {
		return nil
	}
	return &result
}

func ScanBackJob(startBlock, endBlock int64) {
	// Scan back from startBlock to endBlock
	for i := startBlock; i < endBlock; i++ {
		block, _ := ethereum.GetClient().BlockByNumber(context.Background(), big.NewInt(i))
		tx := block.Transactions()
		for _, transaction := range tx {
			resp := GetTxWithJsonRpc(transaction.Hash().String())
			if resp != nil {
				if resp.Result.BlockNumber != "" {
					tx := TxSummary{
						From:  resp.Result.From,
						To:    resp.Result.To,
						Value: resp.Result.Value,
						Hash:  resp.Result.Hash,
						Block: resp.Result.BlockNumber,
						Seq:   resp.Result.TransactionIndex,
						Nonce: resp.Result.Nonce,
					}
					InsertTxOutForAddress(resp.Result.From, tx)
					InsertTxInForAddress(resp.Result.To, tx)
				}
			}
			receipt, _ := ethereum.GetClient().TransactionReceipt(context.Background(), transaction.Hash())
			// Filter ERC20 transfer
			if receipt != nil {
				for _, logEntry := range receipt.Logs {
					if logEntry.Topics[0] == TransferEventHash && len(logEntry.Topics) == 3 {
						InsertTokenForAddress(logEntry.Topics[2].String(), logEntry.Address.String())
						InsertTokenForAddress(logEntry.Topics[1].String(), logEntry.Address.String())
					}
				}
			}
		}

	}
	// Save to db
}

func BlockHeadListener() {
	// Iterate over new head event
	for {
		// Listen to new block
		ch := make(chan *types.Header)
		listener, _ := ethereum.GetClient().SubscribeNewHead(context.Background(), ch)
		for {
			select {
			case err := <-listener.Err():
				{
					log.Println(err)
					break
				}
			case header := <-ch:
				// Read Header
				go func() {
					block, err := ethereum.GetClient().BlockByNumber(context.Background(), header.Number)
					if err != nil {
						return
					}
					tx := block.Transactions()
					for _, transaction := range tx {
						resp := GetTxWithJsonRpc(transaction.Hash().String())
						if resp != nil {
							if resp.Result.BlockNumber != "" {
								tx := TxSummary{
									From:  resp.Result.From,
									To:    resp.Result.To,
									Value: resp.Result.Value,
									Hash:  resp.Result.Hash,
									Block: resp.Result.BlockNumber,
									Seq:   resp.Result.TransactionIndex,
									Nonce: resp.Result.Nonce,
								}
								InsertTxOutForAddress(resp.Result.From, tx)
								InsertTxInForAddress(resp.Result.To, tx)
							}
						}
						receipt, _ := ethereum.GetClient().TransactionReceipt(context.Background(), transaction.Hash())
						// Filter ERC20 transfer
						if receipt != nil {
							for _, logEntry := range receipt.Logs {
								if logEntry.Topics[0] == TransferEventHash && len(logEntry.Topics) == 3 {
									InsertTokenForAddress(logEntry.Topics[2].String(), logEntry.Address.String())
									InsertTokenForAddress(logEntry.Topics[1].String(), logEntry.Address.String())
								}
							}
						}
					}
				}()
			}
		}
	}
}
