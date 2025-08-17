import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export const SYSTEM_PROMPT = `You are a helpful AI assistant that can buy Zora creator coins and OpenSea NFTs/tokens for users. 

When a user asks you to buy a Zora coin, you should:
1. Extract the Zora user handle or profile information from their request
2. Use the buy_zora_coin function to execute the purchase
3. Confirm the purchase details with the user

When a user asks you to buy an OpenSea NFT or collection, you should:
1. Extract the collection slug or NFT details from their request
2. Use the buy_opensea_nft function to execute the purchase
3. Confirm the purchase details with the user

When a user asks you to buy a token on OpenSea, you should:
1. Extract the token symbol or name from their request
2. Use the buy_opensea_token function to execute the swap
3. Confirm the transaction details with the user

You have access to the user's spend permission which allows you to spend up to their daily limit in USDC to buy creator coins, NFTs, or tokens.

Be friendly, helpful, and always confirm purchase details before executing transactions.`

export const ZORA_BUY_FUNCTION = {
  type: 'function' as const,
  function: {
    name: 'buy_zora_coin',
    description: 'Buy a Zora creator coin for a specific user handle and amount',
    parameters: {
      type: 'object',
      properties: {
        zoraHandle: {
          type: 'string',
          description: 'The Zora user handle or identifier to buy coins for',
        },
        amountUSD: {
          type: 'number',
          description: 'The amount in USD to spend on the creator coin',
        },
      },
      required: ['zoraHandle', 'amountUSD'],
    },
  },
}

export const OPENSEA_BUY_NFT_FUNCTION = {
  type: 'function' as const,
  function: {
    name: 'buy_opensea_nft',
    description: 'Buy an NFT from OpenSea by collection slug or specific token',
    parameters: {
      type: 'object',
      properties: {
        collectionSlug: {
          type: 'string',
          description: 'The OpenSea collection slug (e.g., "azuki", "pudgypenguins")',
        },
        tokenId: {
          type: 'string',
          description: 'Optional specific token ID to purchase',
        },
        amountUSD: {
          type: 'number',
          description: 'The maximum amount in USD to spend on the NFT',
        },
      },
      required: ['collectionSlug', 'amountUSD'],
    },
  },
}

export const OPENSEA_BUY_TOKEN_FUNCTION = {
  type: 'function' as const,
  function: {
    name: 'buy_opensea_token',
    description: 'Buy/swap tokens using OpenSea token swap functionality',
    parameters: {
      type: 'object',
      properties: {
        tokenSymbol: {
          type: 'string',
          description: 'The token symbol to buy (e.g., "WETH", "USDC")',
        },
        amountUSD: {
          type: 'number',
          description: 'The amount in USD to swap for the token',
        },
      },
      required: ['tokenSymbol', 'amountUSD'],
    },
  },
}

export async function generateChatResponse(
  messages: ChatMessage[],
  tools: any[] = [ZORA_BUY_FUNCTION, OPENSEA_BUY_NFT_FUNCTION, OPENSEA_BUY_TOKEN_FUNCTION]
) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      tools,
      tool_choice: 'auto',
      max_completion_tokens: 1000,
    })

    return response
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate chat response')
  }
}

export async function streamChatResponse(
  messages: ChatMessage[],
  tools: any[] = [ZORA_BUY_FUNCTION, OPENSEA_BUY_NFT_FUNCTION, OPENSEA_BUY_TOKEN_FUNCTION]
) {
  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      tools,
      tool_choice: 'auto',
      max_completion_tokens: 1000,
      stream: true,
    })

    return stream
  } catch (error) {
    console.error('OpenAI streaming error:', error)
    throw new Error('Failed to stream chat response')
  }
}