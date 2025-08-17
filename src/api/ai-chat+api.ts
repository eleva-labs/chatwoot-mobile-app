import { openai } from '@ai-sdk/openai';
import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'), // Using mini for faster responses
    messages: convertToModelMessages(messages),
    system: `You are an AI assistant for Chatscommerce, a customer service platform. You help agents with:
- Drafting professional responses to customers
- Analyzing conversation sentiment and context
- Suggesting appropriate actions and follow-ups
- Providing customer service best practices
- Helping with conversation management

Be concise, helpful, and professional. Focus on actionable advice for customer service agents.`,
    tools: {
      analyzeConversation: tool({
        description: 'Analyze conversation context and provide insights',
        inputSchema: z.object({
          conversationData: z.string().describe('The conversation data to analyze'),
        }),
        execute: async ({ conversationData }) => {
          // This would integrate with your conversation data
          return {
            sentiment: 'positive',
            urgency: 'medium',
            suggestions: [
              'Follow up within 2 hours',
              'Offer personalized solution',
              'Check customer history'
            ]
          };
        },
      }),
      suggestResponse: tool({
        description: 'Generate suggested responses for customer inquiries',
        inputSchema: z.object({
          customerMessage: z.string().describe('The customer message to respond to'),
          context: z.string().optional().describe('Additional context about the customer'),
        }),
        execute: async ({ customerMessage, context }) => {
          return {
            suggestions: [
              `Thank you for reaching out! I understand your concern about ${customerMessage.toLowerCase()}. Let me help you with that right away.`,
              `I apologize for any inconvenience. I'll investigate this matter and get back to you within the next hour.`,
              `I'd be happy to assist you with this. Could you please provide a bit more detail so I can offer the best solution?`
            ]
          };
        },
      }),
    },
    maxTokens: 1000,
    temperature: 0.7,
  });

  return result.toDataStreamResponse();
}
