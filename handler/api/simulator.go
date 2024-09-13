package api

import (
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gin-gonic/gin"
	"resolver_explorer/service/anvil"
	"resolver_explorer/service/db"
	"resolver_explorer/tasks"
	"strconv"
)

type CreateSimulatorRequest struct {
	RemoteRpc string `json:"remoteRpc"`
}

type UpdateSimulatorRequest struct {
	Port int `json:"port"`
}

type SimulateRequest struct {
	Port  int    `json:"port"`
	From  string `json:"from"`
	To    string `json:"to"`
	Value string `json:"value"`
	Data  string `json:"data"`
}

func CreateNewSimulator(c *gin.Context) {
	r := CreateSimulatorRequest{}
	if c.ShouldBind(&r) != nil {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": "Invalid request",
		})
		return
	}
	// Create a new simulator.
	port, err := anvil.CreateNode(r.RemoteRpc)
	if err != nil {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": err.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"status": "ok",
		"port":   port,
	})
}

func ExtendSimulatorLifeCycle(c *gin.Context) {
	r := UpdateSimulatorRequest{}
	if c.ShouldBind(&r) != nil {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": "Invalid request",
		})
		return
	}
	// Extend the simulator life cycle.
	err := anvil.ExtendNodeLifeCycle(r.Port)
	if err != nil {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": err.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"status": "ok",
	})
}

func KillSimulator(c *gin.Context) {
	r := UpdateSimulatorRequest{}
	if c.ShouldBind(&r) != nil {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": "Invalid request",
		})
		return
	}
	// Extend the simulator life cycle.
	anvil.KillNode(r.Port)
	c.JSON(200, gin.H{
		"status": "ok",
	})
}

func Simulate(c *gin.Context) {
	r := SimulateRequest{}
	if c.ShouldBind(&r) != nil {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": "Invalid request",
		})
		return
	}
	// Simulate the transaction.
	resp, err := anvil.Simulate(r.Port, r.From, r.To, r.Value, r.Data)
	if err != nil {
		c.JSON(200, gin.H{
			"status": "error",
			"detail": err.Error(),
		})
		return
	}
	go tasks.TraceForkedJob(strconv.Itoa(r.Port), resp)
	c.JSON(200, gin.H{
		"status": "ok",
		"resp":   resp,
	})
}

func GetForkTrace(c *gin.Context) {
	port := c.Param("port")
	txId := c.Param("txId")
	rpc := fmt.Sprintf("http://localhost:%s", port)
	result, err := db.Get(db.GetDb(), []byte("fork_trace"+port+txId))
	if err != nil || result == nil || len(result) == 0 {
		dial, err := ethclient.Dial(rpc)
		if err != nil {
			c.JSON(200, gin.H{
				"status": "error_rpc",
				"detail": err.Error(),
			})
			return
		}
		_, isPending, err := dial.TransactionByHash(c, common.HexToHash(txId))
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
			go tasks.TraceJob(rpc, txId)
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
