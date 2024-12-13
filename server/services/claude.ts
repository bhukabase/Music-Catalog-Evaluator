import Anthropic from '@anthropic-ai/sdk';

// Rate limiter implementation
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestsPerMinute = 5;
  
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    const now = Date.now();
    const timeToWait = Math.max(0, this.lastRequestTime + (60000 / this.requestsPerMinute) - now);
    
    await new Promise(resolve => setTimeout(resolve, timeToWait));
    
    const fn = this.queue.shift();
    if (fn) {
      this.lastRequestTime = Date.now();
      await fn();
      this.processQueue();
    }
  }
}

// Initialize Anthropic client with rate limiting
const rateLimiter = new RateLimiter();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function analyzeDocument(content: string) {
  return rateLimiter.schedule(async () => {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Analyze this royalty statement and extract the following information in JSON format:
            {
              "totalStreams": number,
              "revenueByPlatform": {
                "platformName": {
                  "streams": number,
                  "revenue": number
                }
              },
              "topTracks": [
                {
                  "title": string,
                  "streams": number,
                  "revenue": number
                }
              ],
              "releaseDates": {
                "trackTitle": "YYYY-MM-DD"
              }
            }
            
            Content:
            ${content}`
        }]
      });

      try {
        const parsedContent = JSON.parse(response.content[0].text);
        return parsedContent;
      } catch (parseError) {
        console.error('Failed to parse Claude response:', parseError);
        throw new Error('Invalid response format from Claude API');
      }
    } catch (error: any) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  });
}

export async function processImage(base64Image: string): Promise<any> {
  return rateLimiter.schedule(async () => {
    try {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract streaming and revenue data from this dashboard screenshot. Provide the response in the following JSON format:\n" +
                    "{\n" +
                    "  \"totalStreams\": number,\n" +
                    "  \"totalRevenue\": number,\n" +
                    "  \"platforms\": {\n" +
                    "    \"platformName\": {\n" +
                    "      \"streams\": number,\n" +
                    "      \"revenue\": number\n" +
                    "    }\n" +
                    "  }\n" +
                    "}"
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

      try {
        const parsedContent = JSON.parse(response.content[0].text);
        return parsedContent;
      } catch (parseError) {
        console.error('Failed to parse Claude response:', parseError);
        throw new Error('Invalid response format from Claude API');
      }
    } catch (error: any) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to process image: ${error.message}`);
    }
  });
}