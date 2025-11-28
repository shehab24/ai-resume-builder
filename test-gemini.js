const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        // For some reason the SDK doesn't expose listModels directly on genAI instance easily in some versions
        // But we can try to just use a known model.
        // Let's try to instantiate a model and see if it works with a simple prompt.

        const modelsToTry = ["gemini-pro", "gemini-1.0-pro", "gemini-1.5-flash", "gemini-1.5-pro"];

        for (const modelName of modelsToTry) {
            console.log(`Testing model: ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                console.log(`✅ Success with ${modelName}`);
                console.log(result.response.text());
                return; // Stop after first success
            } catch (error) {
                console.log(`❌ Failed with ${modelName}: ${error.message}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
