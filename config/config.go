package config

import "os"

var rpc = "http://localhost:8545"

func init() {
	env, b := os.LookupEnv("NODE_RPC")
	if b {
		rpc = env
	}
}

func GetRpc() string {
	return rpc
}
