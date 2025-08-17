# DataBurnReceiver Deployment Makefile
# Uses Foundry for contract deployment and testing

-include .env

.PHONY: help install test deploy verify clean

help: ## Show this help message
	@echo "DataBurnReceiver Deployment Commands"
	@echo "====================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "Installing Foundry dependencies..."
	forge install OpenZeppelin/openzeppelin-contracts --no-commit
	forge install foundry-rs/forge-std --no-commit
	@echo "Dependencies installed!"

build: ## Build contracts
	@echo "Building contracts..."
	forge build
	@echo "Build complete!"

test: ## Run tests
	@echo "Running tests..."
	forge test -vvv
	@echo "Tests complete!"

test-gas: ## Run tests with gas reporting
	@echo "Running tests with gas reporting..."
	forge test --gas-report
	@echo "Gas report complete!"

coverage: ## Generate test coverage report
	@echo "Generating coverage report..."
	forge coverage
	@echo "Coverage report complete!"

# Deployment commands
deploy-local: ## Deploy to local network
	@echo "Deploying to local network..."
	forge script script/DeployDataBurnReceiver.s.sol --rpc-url localhost --broadcast

deploy-base-sepolia: ## Deploy to Base Sepolia testnet
	@echo "Deploying to Base Sepolia..."
	forge script script/DeployDataBurnReceiver.s.sol \
		--rpc-url base_sepolia \
		--broadcast \
		--verify \
		--etherscan-api-key $(BASESCAN_API_KEY) \
		--slow

deploy-base: ## Deploy to Base mainnet
	@echo "⚠️  DEPLOYING TO BASE MAINNET ⚠️"
	@echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
	@sleep 5
	@echo "Deploying to Base mainnet..."
	forge script script/DeployDataBurnReceiver.s.sol \
		--rpc-url base \
		--broadcast \
		--verify \
		--etherscan-api-key $(BASESCAN_API_KEY) \
		--slow \
		--legacy

verify: ## Verify contract on Basescan
	@echo "Verifying contract on Basescan..."
	@read -p "Enter contract address: " CONTRACT_ADDRESS; \
	forge verify-contract $$CONTRACT_ADDRESS \
		DataBurnReceiver \
		--chain base \
		--etherscan-api-key $(BASESCAN_API_KEY) \
		--compiler-version v0.8.20+commit.a1b79de6

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	forge clean
	rm -rf out cache
	@echo "Clean complete!"

# Utility commands
estimate-gas: ## Estimate deployment gas
	@echo "Estimating deployment gas..."
	forge script script/DeployDataBurnReceiver.s.sol --rpc-url base --gas-estimate

size: ## Check contract size
	@echo "Checking contract sizes..."
	forge build --sizes

snapshot: ## Create gas snapshot
	@echo "Creating gas snapshot..."
	forge snapshot

# Environment setup
setup-env: ## Setup environment file
	@echo "Setting up .env file..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created. Please update with your values."; \
	else \
		echo ".env file already exists."; \
	fi

# Advanced deployment with specific router
deploy-with-baseswap: ## Deploy using BaseSwap router
	@echo "Deploying with BaseSwap router..."
	DEX_ROUTER=0x327Df1E6de05895d2ab08513aaDD9313Fe505d86 \
	forge script script/DeployDataBurnReceiver.s.sol \
		--rpc-url base \
		--broadcast \
		--verify

deploy-with-aerodrome: ## Deploy using Aerodrome router
	@echo "Deploying with Aerodrome router..."
	DEX_ROUTER=0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43 \
	forge script script/DeployDataBurnReceiver.s.sol \
		--rpc-url base \
		--broadcast \
		--verify