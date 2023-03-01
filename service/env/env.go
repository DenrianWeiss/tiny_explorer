package env

import (
	"os"
	"path/filepath"
)

var foundry = ""

var indexer = ""

func init() {
	env, b := os.LookupEnv("FOUNDRY_PATH_OVERRIDE")
	if b {
		foundry = env
	} else {
		foundry = ""
	}
	index, b := os.LookupEnv("INDEXER_START_BLOCK")
	if b {
		indexer = index
	} else {
		indexer = ""
	}
}

func GetIndexerStartBlock() string {
	return indexer
}

func GetAnvilPath() string {
	return filepath.Join(foundry, "anvil")
}

func GetCastPath() string {
	return filepath.Join(foundry, "cast")
}
