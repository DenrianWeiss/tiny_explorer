package ethereum

import (
	"github.com/ethereum/go-ethereum/ethclient"
	"resolver_explorer/config"
)

var ethClient *ethclient.Client

func InitConnect() {
	client, err := ethclient.Dial(config.GetRpc())
	if err != nil {
		panic(err)
	}
	ethClient = client
}

func GetClient() *ethclient.Client {
	return ethClient
}
