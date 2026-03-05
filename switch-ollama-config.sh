#!/bin/bash
# Script to switch between local and API-based Ollama configurations

CONFIG_FILE="../backend/.env"
EXAMPLE_FILE="../backend/.env.ollama-examples"

echo "🔄 Ollama Configuration Switcher"
echo "================================="

echo "1. Local Ollama (running on localhost:11434)"
echo "2. API-based Ollama (cloud service)"
echo "3. Show current configuration"
echo "4. Exit"
echo ""

read -p "Choose option (1-4): " choice

case $choice in
    1)
        echo "Switching to Local Ollama configuration..."
        # Enable local config, disable API config
        sed -i 's/^# LLM_PROVIDER=ollama/LLM_PROVIDER=ollama/' "$CONFIG_FILE"
        sed -i 's/^# OLLAMA_API_URL=http:\/\/localhost:11434\/api\/generate/OLLAMA_API_URL=http:\/\/localhost:11434\/api\/generate/' "$CONFIG_FILE"
        sed -i 's/^LLM_PROVIDER=ollama/# LLM_PROVIDER=ollama/' "$CONFIG_FILE" | grep -A5 "API-BASED OLLAMA SETUP" | head -5 | sed 's/^/# /'
        echo "✅ Switched to Local Ollama configuration"
        ;;
    2)
        read -p "Enter your Ollama API key: " api_key
        echo "Switching to API-based Ollama configuration..."
        # Enable API config, disable local config
        sed -i 's/^LLM_PROVIDER=ollama/# LLM_PROVIDER=ollama/' "$CONFIG_FILE"
        sed -i 's/^OLLAMA_API_URL=http:\/\/localhost:11434\/api\/generate/# OLLAMA_API_URL=http:\/\/localhost:11434\/api\/generate/' "$CONFIG_FILE"
        sed -i 's/^# LLM_PROVIDER=ollama/LLM_PROVIDER=ollama/' "$CONFIG_FILE"
        sed -i 's/^# OLLAMA_API_URL=https:\/\/api.ollama.com\/v1\/chat/OLLAMA_API_URL=https:\/\/api.ollama.com\/v1\/chat/' "$CONFIG_FILE"
        sed -i "s/^# OLLAMA_API_KEY=.*/OLLAMA_API_KEY=$api_key/" "$CONFIG_FILE"
        echo "✅ Switched to API-based Ollama configuration"
        ;;
    3)
        echo "Current configuration:"
        grep "^LLM_PROVIDER\|^OLLAMA_API_URL\|^OLLAMA_API_KEY\|^OLLAMA_MODEL" "$CONFIG_FILE"
        ;;
    4)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "🧪 Test your configuration with: cd backend && node test-ollama.js"