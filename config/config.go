package config

import (
	"os"
	"strings"
)

var rpc = "http://localhost:18545"

func init() {
	env, b := os.LookupEnv("NODE_RPC")
	if b {
		rpc = env
	}
}

func GetRpc() string {
	return rpc
}

func GetHttpRpc() string {
	rpcUrl := GetRpc()
	if strings.HasPrefix(rpcUrl, "ws") {
		// Replace ws with http
		rpcUrl = "http" + rpcUrl[2:]
	}
	return rpcUrl
}
