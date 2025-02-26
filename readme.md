# Explorer

Simple Blockchain Explorer for anvil forked network.

## Usage

See docker-compose.yml.

## Config

### Environment Variables

- NODE_RPC: RPC endpoint of the node
- ETHERSCAN_API_KEY: Etherscan API key

### Add custom contract ABI

Add a file named `mapping.json` in abi directory and pass the path to the /abi in the container.