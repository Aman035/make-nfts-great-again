import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { LLMService, LLMProvider } from './llm.service';

@ApiTags('llm')
@Controller('llm')
export class LLMController {
  constructor(private readonly llmService: LLMService) {}

  @Get('provider')
  @ApiOperation({
    summary: 'Get current LLM provider',
    description: 'Returns the currently active LLM provider',
  })
  @ApiResponse({
    status: 200,
    description: 'Current provider information',
    schema: {
      type: 'object',
      properties: {
        provider: {
          type: 'string',
          example: 'openai',
        },
      },
    },
  })
  getCurrentProvider() {
    return {
      provider: this.llmService.getCurrentProvider(),
    };
  }

  @Post('test')
  @ApiOperation({
    summary: 'Test LLM functionality',
    description: 'Send a test message to the LLM to verify it is working',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Test message to send to the LLM',
          example: 'Hello, how are you?',
        },
        system: {
          type: 'string',
          description: 'Optional system prompt',
          example: 'You are a helpful AI assistant.',
        },
      },
      required: ['message'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'LLM test successful',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true,
        },
        response: {
          type: 'string',
          example: 'I am doing well, thank you for asking!',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'LLM test failed',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false,
        },
        error: {
          type: 'string',
          example: 'API key not configured',
        },
      },
    },
  })
  async testLLM(@Body() body: { message: string; system?: string }) {
    try {
      const response = await this.llmService.respondText({
        system: body.system || 'You are a helpful AI assistant.',
        user: body.message,
      });

      return {
        success: true,
        response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
