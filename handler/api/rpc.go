package api

import (
	"github.com/gin-gonic/gin"
	"resolver_explorer/config"
)

func GetRpc(c *gin.Context) {
	c.Data(200, "text/plain", []byte(config.GetRpc()))
}
