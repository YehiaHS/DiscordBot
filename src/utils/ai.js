const dotenv = require('dotenv');
dotenv.config();

const FREE_MODELS = [
    'arcee-ai/trinity-large-preview:free',
    'stepfun/step-3.5-flash:free',
    'tngtech/deepseek-r1t2-chimera:free',
    'z-ai/glm-4.5-air:free',
    'deepseek/deepseek-r1-0528:free',
    'tngtech/deepseek-r1t-chimera:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'tngtech/tng-r1t-chimera:free',
    'openai/gpt-oss-120b:free',
    'upstage/solar-pro-3:free',
    'arcee-ai/trinity-mini:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-coder:free',
    'nvidia/nemotron-nano-9b-v2:free',
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'openai/gpt-oss-20b:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'google/gemma-3-27b-it:free',
    'liquid/lfm-2.5-1.2b-instruct:free',
    'liquid/lfm-2.5-1.2b-thinking:free',
    'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    'mistralai/mistral-small-3.1-24b-instruct:free',
    'google/gemma-3n-e2b-it:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
    'google/gemma-3-12b-it:free',
    'qwen/qwen3-4b:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'google/gemma-3-4b-it:free',
    'google/gemma-3n-e4b-it:free'
];

/**
 * Clean the AI response to remove markdown code blocks and excess whitespace.
 * @param {string} text 
 * @returns {string}
 */
function cleanResponse(text) {
    if (!text) return '';
    return text.replace(/`/g, '').trim();
}

/**
 * Generate a completion from OpenRouter with fallback support.
 * @param {string} systemPrompt 
 * @param {string} userPrompt 
 * @param {string} [initialModel] 
 * @returns {Promise<string|null>}
 */
async function generateCompletion(systemPrompt, userPrompt, initialModel) {
    if (!process.env.OPENROUTER_API_KEY) {
        console.warn('OPENROUTER_API_KEY is missing in .env');
        return null;
    }

    const modelsToTry = initialModel ? [initialModel, ...FREE_MODELS] : FREE_MODELS;

    for (const model of modelsToTry) {
        try {
            console.log(`Calling OpenRouter with model: ${model}`);
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/Starttoaster/jewbot',
                    'X-Title': 'Jewbot'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`OpenRouter model ${model} failed: ${response.status}. Trying next...`);
                continue;
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            if (content) return cleanResponse(content);

        } catch (error) {
            console.error(`Error with model ${model}:`, error.message);
        }
    }

    console.error('All OpenRouter models failed.');
    return null;
}

module.exports = { generateCompletion };

