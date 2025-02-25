package explorer

import "fmt"

func BuildRequestAddress(chainId string, module string, action string, address string, apiKey string) string {
	return fmt.Sprintf("https://api.etherscan.io/v2/api?chainid=%s&module=%s&action=%s&address=%s&apikey=%s",
		chainId, module, action, address, apiKey)
}
