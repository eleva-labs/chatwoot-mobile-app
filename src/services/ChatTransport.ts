import { createOpenAI } from '@ai-sdk/openai';
import { generateText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';

/**
 * Custom transport for AI SDK that calls OpenAI directly
 * This bypasses the need for API routes in React Native apps
 */
export class ChatTransport {
  private openai: ReturnType<typeof createOpenAI>;

  constructor(apiKey: string) {
    this.openai = createOpenAI({
      apiKey: apiKey,
    });
  }

  async call(url: string, options: RequestInit): Promise<Response> {
    console.log('🚀 Custom ChatTransport - Request received');
    console.log('🔗 URL:', url);
    console.log('🛠️ Options:', JSON.stringify(options, null, 2));

    try {
      // Parse the request body to get messages
      const body = JSON.parse(options.body as string);
      const { messages } = body;

      console.log('📨 Messages received:', messages.length, 'messages');
      console.log('📝 Latest message:', messages[messages.length - 1]);

      console.log('🔑 OpenAI client configured successfully');

      console.log('🤖 Starting generateText (non-streaming)...');
      const result = await generateText({
        model: this.openai('gpt-4o'),
        messages: convertToModelMessages(messages),
        tools: {
          weather: tool({
            description: 'Get the weather in a location (fahrenheit)',
            inputSchema: z.object({
              location: z.string().describe('The location to get the weather for'),
            }),
            execute: async ({ location }) => {
              console.log('🌤️ Weather tool called for:', location);
              const temperature = Math.round(Math.random() * (90 - 32) + 32);
              console.log('🌡️ Generated temperature:', temperature);
              return {
                location,
                temperature,
              };
            },
          }),
          convertFahrenheitToCelsius: tool({
            description: 'Convert a temperature in fahrenheit to celsius',
            inputSchema: z.object({
              temperature: z.number().describe('The temperature in fahrenheit to convert'),
            }),
            execute: async ({ temperature }) => {
              console.log('🔄 Converting temperature:', temperature, 'F to C');
              const celsius = Math.round((temperature - 32) * (5 / 9));
              console.log('🌡️ Converted temperature:', celsius, 'C');
              return {
                celsius,
              };
            },
          }),
        },
      });

      console.log('✅ GenerateText completed!');
      console.log('📤 Response text:', result.text);
      console.log('📏 Response length:', result.text.length);
      
      const finalResult = result.text;
      
      // Create a simple JSON response with the collected text
      const responseData = {
        type: 'text',
        text: finalResult
      };
      
      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('💥 Custom ChatTransport Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`ChatTransport Error: ${errorMessage}`);
    }
  }
}

/**
 * Factory function to create a transport instance
 */
export const createChatTransport = () => {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OpenAI API key not found. Please set EXPO_PUBLIC_OPENAI_API_KEY or OPENAI_API_KEY environment variable.',
    );
  }

  return new ChatTransport(apiKey);
};
