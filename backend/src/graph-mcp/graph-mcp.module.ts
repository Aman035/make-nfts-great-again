import { Module } from '@nestjs/common';
import { GraphMCPService } from './graph-mcp.service';
import { GraphMCPController } from './graph-mcp.controller';

@Module({
  providers: [GraphMCPService],
  controllers: [GraphMCPController],
  exports: [GraphMCPService], // Export so other modules can use it
})
export class GraphMCPModule {}
