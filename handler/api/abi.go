package api

import (
	"github.com/gin-gonic/gin"
	"resolver_explorer/service/explorer"
	"strings"
)

func GetAbi(c *gin.Context) {
	contract := c.Param("contract")
	contract = strings.ToLower(contract)
	abi := explorer.LoadAbi(contract)

	c.JSON(200, gin.H{
		"status": "ok",
		"result": abi,
	})
}
