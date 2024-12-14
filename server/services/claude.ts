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
    const requestId = Date.now().toString();
    console.log(`[Claude ${requestId}] Starting document analysis...`);
    
    try {
      // Log a sample of the content for debugging
      console.log(`[Claude ${requestId}] Content sample:`, {
        length: content.length,
        sample: content.substring(0, 200) + '...',
        containsNumbers: /\d+/.test(content),
        containsDates: /\d{4}[-/]\d{2}[-/]\d{2}/.test(content)
      });

      // Enhanced prompt for more accurate extraction
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.2, // Lower temperature for more consistent output
        messages: [{
          role: 'user',
          content: `You are a financial document analyzer specialized in music streaming royalty statements.

Your task is to extract specific data points from this royalty statement. Be precise and only extract information that is explicitly stated.

Required fields to extract:
1. Platform name (e.g., Spotify, Apple Music)
   - Look for direct mentions of streaming service names
   - If unclear, mark as "Unknown Platform"

2. Number of streams
   - Look for numbers explicitly labeled as streams/plays
   - Must be a whole number
   - If not found, do not substitute with other metrics

3. Revenue amount
   - Look for monetary values (USD)
   - Must be a decimal number
   - Only include actual revenue, not projections

4. Statement date
   - Find the specific date this statement covers
   - Convert any date format to YYYY-MM-DD
   - Use the most recent date if multiple dates present

Rules:
- Only extract information that is explicitly stated
- Do not make assumptions or calculations
- If a required field is not found, exclude that record
- Ensure all numerical values are properly formatted

Return the data in this exact JSON format:
[
  {
    "platform": string,
    "streams": number (integer),
    "revenue": number (decimal),
    "date": "YYYY-MM-DD"
  }
]

Content to analyze:
${content}`
        }]
      });

      console.log('Received response from Claude');
      
      // Extract and validate response
      const responseContent = response.content[0];
      if (!responseContent || typeof responseContent !== 'object') {
        console.error(`[Claude ${requestId}] Invalid response format:`, responseContent);
        throw new Error('Invalid response format from Claude API');
      }

      const textContent = responseContent.type === 'text' ? responseContent.text : '';
      console.log(`[Claude ${requestId}] Raw response:`, {
        length: textContent.length,
        sample: textContent.substring(0, 200)
      });

      let parsedData;
      
      // First attempt: direct JSON parse
      try {
        parsedData = JSON.parse(textContent);
        console.log(`[Claude ${requestId}] Successfully parsed response as JSON`);
      } catch (parseError) {
        console.log(`[Claude ${requestId}] Direct JSON parse failed, attempting to extract JSON from text`);
        
        // Second attempt: find JSON array in text
        const jsonMatch = textContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          try {
            parsedData = JSON.parse(jsonMatch[0]);
            console.log(`[Claude ${requestId}] Successfully extracted and parsed JSON from text`);
          } catch (extractError) {
            console.error(`[Claude ${requestId}] Failed to parse extracted JSON:`, extractError);
            throw new Error('Could not parse JSON from response');
          }
        } else {
          console.error(`[Claude ${requestId}] No JSON-like structure found in response`);
          throw new Error('No valid JSON structure found in response');
        }
      }

      // Validate the parsed data
      if (!Array.isArray(parsedData)) {
        console.error(`[Claude ${requestId}] Parsed data is not an array:`, parsedData);
        throw new Error('Response data must be an array');
      }

      // Filter and validate each record
      const validatedData = parsedData
        .filter(item => {
          const valid = (
            item &&
            typeof item === 'object' &&
            typeof item.platform === 'string' &&
            typeof item.streams === 'number' &&
            Number.isInteger(item.streams) &&
            typeof item.revenue === 'number' &&
            typeof item.date === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(item.date)
          );

          if (!valid) {
            console.log(`[Claude ${requestId}] Filtered out invalid record:`, item);
          }
          return valid;
        })
        .map(item => ({
          ...item,
          streams: Math.floor(item.streams), // Ensure integer
          revenue: Number(item.revenue.toFixed(2)) // Normalize to 2 decimal places
        }));

      if (validatedData.length === 0) {
        console.error(`[Claude ${requestId}] No valid records found in response`);
        throw new Error('No valid records found in analyzed data');
      }

      console.log(`[Claude ${requestId}] Analysis complete:`, {
        totalRecords: validatedData.length,
        sample: validatedData[0]
      });

      return validatedData;
    } catch (error: any) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  });
}

// Helper function to validate analysis result
function validateAnalysisResult(data: any): boolean {
  if (!Array.isArray(data)) {
    console.error('Analysis result is not an array');
    return false;
  }

  return data.every(item => {
    const valid = (
      typeof item === 'object' &&
      typeof item.platform === 'string' &&
      typeof item.streams === 'number' &&
      typeof item.revenue === 'number' &&
      typeof item.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    );

    if (!valid) {
      console.error('Invalid item in analysis result:', item);
    }

    return valid;
  });
}

export async function processImage(base64Image: string) {
  return rateLimiter.schedule(async () => {
    try {
      console.log('Starting image analysis with Claude...');

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this royalty statement screenshot and extract the following information:
- Platform (e.g., Spotify, Apple Music)
- Number of streams
- Revenue amount
- Statement period/date

Return the data in this exact JSON format:
[
  {
    "platform": "platform name",
    "streams": number,
    "revenue": number,
    "date": "YYYY-MM-DD"
  }
]`
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

      const responseContent = response.content[0];
      if (!responseContent || typeof responseContent !== 'object') {
        throw new Error('Invalid response format from Claude API');
      }

      const textContent = responseContent.type === 'text' ? responseContent.text : '';
      console.log('Raw image analysis response:', textContent);

      try {
        // Try to parse as JSON directly
        const parsedData = JSON.parse(textContent);
        console.log('Successfully parsed image analysis:', JSON.stringify(parsedData, null, 2));
        return parsedData;
      } catch (parseError) {
        console.error('Failed to parse image analysis response:', parseError);
        
        // Attempt to extract JSON from the text if it's embedded in other text
        const jsonMatch = textContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[0]);
            console.log('Successfully extracted and parsed JSON from image analysis');
            return extractedJson;
          } catch (secondaryParseError) {
            console.error('Failed to parse extracted JSON:', secondaryParseError);
          }
        }
        
        throw new Error('Could not parse image analysis response');
      }
    } catch (error: any) {
      console.error('Claude image analysis error:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  });
}
