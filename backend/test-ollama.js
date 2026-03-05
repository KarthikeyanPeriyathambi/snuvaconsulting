import llmService from './utils/llmService.js';

// Test function to verify Ollama integration with minimax-m2.5:cloud
async function testOllamaIntegration() {
  console.log(`Testing Ollama integration with model: ${llmService.ollamaModel}`);
  console.log(`Configuration: ${llmService.isApiBased ? 'API-based' : 'Local'} Ollama`);
  console.log(`API URL: ${llmService.ollamaUrl}`);
  console.log(`API Key configured: ${!!llmService.ollamaApiKey}`);
  
  try {
    // Test prompt
    const testPrompt = `Parse the following resume information and extract structured data in JSON format:
    
    Name: John Doe
    Email: john.doe@example.com
    Phone: +1234567890
    Skills: JavaScript, React, Node.js, Python
    Experience: 3 years as Software Developer
    
    Format the output as a JSON object with fields: name, email, phone, skills (array), experience.`;
    
    console.log('Sending test request to LLM...');
    const response = await llmService.sendRequest(testPrompt);
    
    console.log('Raw response:', JSON.stringify(response, null, 2));
    
    // Try to extract JSON
    const parsed = llmService.extractJsonFromResponse(response);
    console.log('Parsed JSON:', JSON.stringify(parsed, null, 2));
    
    console.log('✅ Ollama integration test successful!');
    
  } catch (error) {
    console.error('❌ Ollama integration test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testOllamaIntegration();