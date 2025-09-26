import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { PersonaService } from './persona.service';
import { LLMService } from './llm.service';
import { MCPService } from './mcp.service';
import { MCPToolsService } from './mcp-tools.service';

@Module({
  imports: [],
  controllers: [AgentController],
  providers: [
    AgentService,
    PersonaService,
    LLMService,
    MCPService,
    MCPToolsService,
  ],
})
export class AgentModule {}
