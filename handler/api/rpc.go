package api

import (
	"github.com/gin-gonic/gin"
	"resolver_explorer/config"
	"strings"
)

func GetRpc(c *gin.Context) {
	rpcUrl := config.GetRpc()
	if strings.HasPrefix(rpcUrl, "ws") {
		// Replace ws with http
		rpcUrl = "http" + rpcUrl[2:]
	}
	c.Data(200, "text/plain", []byte(rpcUrl))
}
