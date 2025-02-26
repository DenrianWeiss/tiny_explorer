package api

import (
	"github.com/gin-gonic/gin"
)

func GetRpc(c *gin.Context) {
	c.Data(200, "text/plain", []byte("/rpc"))
}
