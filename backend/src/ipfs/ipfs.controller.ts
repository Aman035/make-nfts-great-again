import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { IPFSResolverService } from './ipfs-resolver.service';

@ApiTags('ipfs')
@Controller('ipfs')
export class IPFSController {
  constructor(private readonly ipfsResolverService: IPFSResolverService) {}

  @Post('resolve')
  @ApiOperation({
    summary: 'Resolve IPFS URL',
    description: 'Convert IPFS URL to HTTP URL using available gateways',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'IPFS URL to resolve',
          example:
            'ipfs://QmNf1UsmdGaMbpatQ6toXSkzDpizaGmC9zfunCyoz1enD5/penguin/7247.png',
        },
      },
      required: ['url'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'IPFS URL resolved successfully',
    schema: {
      type: 'object',
      properties: {
        originalUrl: { type: 'string' },
        resolvedUrl: { type: 'string' },
        isResolved: { type: 'boolean' },
        gateway: { type: 'string' },
      },
    },
  })
  async resolveIPFS(@Body() body: { url: string }) {
    return await this.ipfsResolverService.resolveIPFSUrl(body.url);
  }

  @Post('resolve-batch')
  @ApiOperation({
    summary: 'Resolve multiple IPFS URLs',
    description: 'Convert multiple IPFS URLs to HTTP URLs',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of IPFS URLs to resolve',
        },
      },
      required: ['urls'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'IPFS URLs resolved successfully',
  })
  async resolveIPFSBatch(@Body() body: { urls: string[] }) {
    return await this.ipfsResolverService.resolveIPFSUrls(body.urls);
  }

  @Get('test')
  @ApiOperation({
    summary: 'Test IPFS resolution',
    description: 'Test IPFS URL resolution with a sample URL',
  })
  @ApiQuery({
    name: 'url',
    required: false,
    description: 'IPFS URL to test (optional, uses default if not provided)',
  })
  @ApiResponse({
    status: 200,
    description: 'Test result',
  })
  async testIPFS(@Query('url') url?: string) {
    const testUrl =
      url ||
      'ipfs://QmNf1UsmdGaMbpatQ6toXSkzDpizaGmC9zfunCyoz1enD5/penguin/7247.png';
    return await this.ipfsResolverService.resolveIPFSUrl(testUrl);
  }
}
