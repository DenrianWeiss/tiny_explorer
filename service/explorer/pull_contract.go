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

type GetCodeResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Result  []struct {
		SourceCode           string `json:"SourceCode"`
		ABI                  string `json:"ABI"`
		ContractName         string `json:"ContractName"`
		CompilerVersion      string `json:"CompilerVersion"`
		OptimizationUsed     string `json:"OptimizationUsed"`
		Runs                 string `json:"Runs"`
		ConstructorArguments string `json:"ConstructorArguments"`
		EVMVersion           string `json:"EVMVersion"`
		Library              string `json:"Library"`
		LicenseType          string `json:"LicenseType"`
		Proxy                string `json:"Proxy"`
		Implementation       string `json:"Implementation"`
		SwarmSource          string `json:"SwarmSource"`
		SimilarMatch         string `json:"SimilarMatch"`
	} `json:"result"`
}

func LoadFromEtherScan(address string) string {
	rpc := config.GetHttpRpc()
	dial, _ := ethclient.Dial(rpc)
	chainId, _ := dial.ChainID(context.TODO())
	// First probe if contract is proxy
	requestProbe := BuildRequestAddress(chainId.String(), "contract", "getsourcecode", address, config.GetEtherscanAPIKey())
	respProbe, errProbe := http.Get(requestProbe)
	if errProbe != nil {
		fmt.Printf("Failed to fetch contract creation from etherscan: %s", errProbe)
		return ""
	}
	defer respProbe.Body.Close()
	rProbe, _ := io.ReadAll(respProbe.Body)
	rProbeJson := GetCodeResponse{}
	_ = json.Unmarshal(rProbe, &rProbeJson)
	// If response is not ok
	if rProbeJson.Status != "1" {
		return ""
	}
	// If contract is proxy
	if rProbeJson.Result[0].Proxy == "1" {
		// Fetch implementation address
		implementation := rProbeJson.Result[0].Implementation
		// Load abi from implementation address
		abi := LoadAbi(implementation)
		SetAbi(address, "", abi)
		return abi
	}
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
