const OpenAI = require('openai');

// Use your actual API key here
const openai = new OpenAI({
  apiKey: 'sk-your-actual-key-here'
});

async function testOpenAI() {
  try {
    console.log("Testing OpenAI API...");
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Try with a less restricted model
      messages: [{ role: "user", content: "Hello, testing 1-2-3" }],
      max_tokens: 20
    });
    
    console.log("Success! Response:");
    console.log(completion.choices[0].message);
  } catch (error) {
    console.error("Error testing OpenAI API:");
    console.error(error);
  }
}

testOpenAI(); 