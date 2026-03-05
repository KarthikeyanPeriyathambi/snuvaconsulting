#!/bin/bash
# Setup script for minimax-m2.5:cloud model

echo "🚀 Setting up minimax-m2.5:cloud model for Ollama..."

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed. Please install it first from https://ollama.com/"
    exit 1
fi

echo "✅ Ollama is installed"

# Check if Ollama service is running
if ! pgrep -f "ollama" > /dev/null; then
    echo "⚠️  Ollama service is not running. Starting it..."
    ollama serve &
    sleep 5
fi

echo "✅ Ollama service is running"

# Pull the minimax-m2.5:cloud model
echo "📥 Pulling minimax-m2.5:cloud model..."
ollama pull minimax-m2.5:cloud

if [ $? -eq 0 ]; then
    echo "✅ minimax-m2.5:cloud model downloaded successfully!"
    echo "🧪 You can now test the integration with:"
    echo "   cd backend && node test-ollama.js"
else
    echo "❌ Failed to download minimax-m2.5:cloud model"
    echo "Please check your internet connection and try again"
fi