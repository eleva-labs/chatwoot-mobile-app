import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages, tool, stepCountIs } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  console.log('🚀 AI Chat API - Request received');
  
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    console.log('📨 Messages received:', messages.length, 'messages');
    console.log('📝 Latest message:', messages[messages.length - 1]);

    // Check for OpenAI API key
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ No OpenAI API key found');
      return new Response('OpenAI API key not configured', { status: 500 });
    }
    console.log('🔑 OpenAI API key found:', apiKey ? 'Yes' : 'No');

    console.log('🤖 Starting streamText...');
    const result = streamText({
      model: openai('gpt-4o'),
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(5),
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

    console.log('✅ StreamText created, returning response...');
    const response = result.toUIMessageStreamResponse({
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'none',
      },
    });
    console.log('📤 Response created and returning');
    return response;

  } catch (error) {
    console.error('💥 AI Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Error: ${errorMessage}`, { status: 500 });
  }
}
