package anvil

import (
	"errors"
	"os/exec"
	"strconv"
	"sync"
	"time"
)

// Node: Launch and manage anvil node life cycle

var portList []int
var portListLock sync.Mutex
var portToKiller map[int]func()
var portToTimer map[int]*time.Timer
var portToTimerKiller map[int]chan struct{}

func init() {
	// Add 19100 - 19163 to portList
	for i := 0; i < 64; i++ {
		portList = append(portList, 19100+i)
	}
	portToKiller = make(map[int]func())
	portToTimer = make(map[int]*time.Timer)
	portToTimerKiller = make(map[int]chan struct{})
}

func startAnvilNode(port int, upstream string) (int, error) {
	// Start anvil node
	/// Create process with "anvil -f <upstream> -p <port>"
	process := exec.Command("anvil", "-f", upstream, "-p", strconv.Itoa(port))
	/// Get pid
	/// Start dedicated goroutine to wait for process to exit
	err := process.Start()
	if err != nil {
		return 0, err
	}
	/// Save pid to portToPid and pidToPort
	portToKiller[port] = func() {
		_ = process.Process.Kill()
		_, _ = process.Process.Wait()
		// Return port to portList
		portListLock.Lock()
		defer portListLock.Unlock()
		portList = append(portList, port)
		// Signal the timer to stop
		timerKiller, ok := portToTimerKiller[port]
		if ok {
			timerKiller <- struct{}{}
		}
		delete(portToKiller, port)
		delete(portToTimer, port)
		delete(portToTimerKiller, port)
	}
	/// Create a timer to kill the process after 1 hour
	timer := time.NewTimer(time.Hour)
	canceller := make(chan struct{})
	go func() {
		select {
		case <-timer.C:
			portToKiller[port]()
		case <-canceller:
			return
		}
	}()
	portToTimer[port] = timer
	portToTimerKiller[port] = canceller

	return port, nil
}

func CreateNode(upstream string) (string, error) {
	portListLock.Lock()
	defer portListLock.Unlock()
	// Pop a port from portList
	if len(portList) == 0 {
		return "", errors.New("no available port")
	}
	port := portList[0]
	portList = portList[1:]
	// Start anvil node
	pid, err := startAnvilNode(port, upstream)
	if err != nil {
		return "", err
	}
	return strconv.Itoa(pid), nil
}

func KillNode(port int) {
	killer, ok := portToKiller[port]
	if ok {
		killer()
	}
}

func ExtendNodeLifeCycle(port int) error {
	portListLock.Lock()
	defer portListLock.Unlock()
	timer, ok := portToTimer[port]
	if !ok {
		return errors.New("port not found")
	}
	timer.Reset(time.Hour)
	return nil
}
