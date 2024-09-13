package static

import (
	"embed"
	"github.com/gin-gonic/gin"
)

//go:embed script/*
var EmbedFs embed.FS

//go:embed index.html
var IndexHtml []byte

//go:embed block.html
var blockHtml []byte

//go:embed tx.html
var txHtml []byte

//go:embed fork_tx.html
var forkTxHtml []byte

//go:embed account.html
var accountHtml []byte

//go:embed simulator.html
var simulatorHtml []byte

func IndexHandler(c *gin.Context) {
	c.Data(200, "text/html", IndexHtml)
}

func BlockHandler(c *gin.Context) {
	c.Data(200, "text/html", blockHtml)
}

func TxHandler(c *gin.Context) {
	c.Data(200, "text/html", txHtml)
}

func ForkTxHandler(c *gin.Context) {
	c.Data(200, "text/html", forkTxHtml)
}

func AccountHandler(c *gin.Context) {
	c.Data(200, "text/html", accountHtml)
}

func SimulatorHandler(c *gin.Context) {
	c.Data(200, "text/html", simulatorHtml)
}
