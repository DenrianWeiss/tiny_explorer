package api

import (
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gin-gonic/gin"
	"resolver_explorer/config"
	"resolver_explorer/service/db"
	"resolver_explorer/tasks"
)

func GetTrace(c *gin.Context) {
	id := c.Param("txId")
	result, err := db.Get(db.GetDb(), []byte("trace"+id))
	if err != nil || result == nil || len(result) == 0 {
		// Test transaction exists
		rpc := config.GetHttpRpc()
		dial, err := ethclient.Dial(rpc)
		if err != nil {
			c.JSON(200, gin.H{
				"status": "error_rpc",
				"detail": err.Error(),
			})
			return
		}
		_, isPending, err := dial.TransactionByHash(c, common.HexToHash(id))
		if err != nil {
			c.JSON(200, gin.H{
				"status": "error_tx",
				"detail": err.Error(),
			})
			return
		}
		if !isPending {
			c.JSON(200, gin.H{
				"status": "pending",
			})
			go tasks.TraceJob(rpc, id)
			return
		}
		c.JSON(200, gin.H{
			"status": "pending_tx",
		})
		return
	} else {
		if string(result) == "1" {
			c.JSON(200, gin.H{
				"status": "pending",
			})
			return
		}
		c.JSON(200, gin.H{
			"status": "ok",
			"result": fmt.Sprintf("<body style=\"font: monospace;\">%s</body>", result),
		})
	}
}
