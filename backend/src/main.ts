import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for all origins
  app.enableCors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Make NFTs Great Again API')
    .setDescription('API for blockchain data analysis and NFT companion agent')
    .setVersion('1.0')
    .addTag('agent', 'AI agent for blockchain data analysis')
    .addTag('health', 'Health check endpoints')
    .addTag('llm', 'Large Language Model management')
    .addTag('graph-mcp', 'Graph MCP for blockchain data analysis')
    .addTag('nft-agent', 'NFT agent for blockchain data analysis')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
bootstrap();
