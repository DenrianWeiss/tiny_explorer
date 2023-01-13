package api

import (
	"encoding/hex"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gin-gonic/gin"
	"resolver_explorer/config"
)

func GetTx(c *gin.Context) {
	id := c.Param("txId")
	// Call GoEthereum for tx details.
	rpc := config.GetRpc()
	dial, err := ethclient.Dial(rpc)
	if err != nil {
		c.JSON(200, gin.H{
			"status": "error_rpc",
			"detail": err.Error(),
		})
		return
	}
	tx, isPending, err := dial.TransactionByHash(c, common.HexToHash(id))
	if err != nil {
		c.JSON(200, gin.H{
			"status": "error_tx",
			"detail": err.Error(),
		})
		return
	}
	resp := gin.H{
		"status":    "ok",
		"gas_limit": tx.Gas(),
		"value":     tx.Value().String(),
		"call_data": hex.EncodeToString(tx.Data()),
		"to":        tx.To(),
	}
	if !isPending {
		receipt, _ := dial.TransactionReceipt(c, common.HexToHash(id))
		if receipt.Status == types.ReceiptStatusFailed {
			resp["status"] = "failed"
		} else {
			resp["status"] = "success"
			// Handle events.
		}
		resp["block_number"] = receipt.BlockNumber
	} else {
		resp["status"] = "pending"
	}
	c.JSON(200, resp)
}
