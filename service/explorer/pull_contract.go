package explorer

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/ethereum/go-ethereum/ethclient"
	"io"
	"net/http"
	"resolver_explorer/config"
	"resolver_explorer/service/db"
)

type GetAbiResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Result  string `json:"result"`
}

func LoadFromEtherScan(address string) string {
	rpc := config.GetHttpRpc()
	dial, _ := ethclient.Dial(rpc)
	chainId, _ := dial.ChainID(context.TODO())
	requestUrl := BuildRequestAddress(chainId.String(), "contract", "getabi", address, config.GetEtherscanAPIKey())
	// Fetch abi from etherscan
	resp, err := http.Get(requestUrl)
	if err != nil {
		fmt.Printf("Failed to fetch abi from etherscan: %s", err)
		return ""
	}
	defer resp.Body.Close()
	r, _ := io.ReadAll(resp.Body)
	rJson := GetAbiResponse{}
	// Parse response
	_ = json.Unmarshal(r, &rJson)
	// Set abi if ok
	if rJson.Status == "1" {
		SetAbi(address, "", rJson.Result)
	}
	return rJson.Result
}

func LoadAbi(address string) string {
	// First try to load from db
	abi, err := GetAbi(address)
	if err != nil || abi == "" {
		// Load from etherscan if not found
		abi = LoadFromEtherScan(address)
	}
	return abi
}

func SetAbi(address string, codeHash string, abi string) error {
	return db.Set(db.GetDb(), []byte("abi_"+address), []byte(abi))
}

func GetAbi(address string) (string, error) {
	r, err := db.Get(db.GetDb(), []byte("abi_"+address))
	if err != nil {
		return "", err
	}
	return string(r), nil
}
