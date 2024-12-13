import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeDocument(content: string) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Analyze this royalty statement and extract the following information:
          - Total streams
          - Revenue per platform
          - Top performing tracks
          - Release dates
          
          Content:
          ${content}`
      }]
    });

    return response.content;
  } catch (error: any) {
    console.error('Claude API error:', error);
    throw new Error('Failed to analyze document');
  }
}

export async function processImage(base64Image: string) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract streaming and revenue data from this dashboard screenshot."
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }]
    });

    return response.content;
  } catch (error: any) {
    console.error('Claude API error:', error);
    throw new Error('Failed to process image');
  }
}
