package api

import (
	"github.com/gin-gonic/gin"
	"resolver_explorer/service/indexer"
)

func GetTxs(c *gin.Context) {
	a := c.Param("address")
	if a == "" {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": "address is empty",
		})
		return
	}
	c.JSON(200, gin.H{
		"in":  indexer.TxInRecord[a],
		"out": indexer.TxOutRecord[a],
	})
}

func GetTokens(c *gin.Context) {
	a := c.Param("address")
	if a == "" {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": "address is empty",
		})
		return
	}
	c.JSON(200, gin.H{
		"tokens": indexer.TokenRecord[a],
	})
}
