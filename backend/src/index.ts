import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { prisma } from './db/prisma';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);

export async function createServer() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(cors());
  app.use(express.json());

  // Health check endpoint for monitoring and cloud platforms
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'connected',
      });
    } catch (error: any) {
      res.status(503).json({
        status: 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error?.message || 'Database connection error',
      });
    }
  });

  // Main GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    }) as unknown as express.RequestHandler
  );

  return { app, httpServer, server };
}

if (process.env.NODE_ENV !== 'test') {
  createServer().then(({ httpServer }) => {
    httpServer.listen(PORT, () => {
      console.log(`🚀 Release Checklist GraphQL API running at http://localhost:${PORT}/graphql`);
      console.log(`🩺 Health check endpoint running at http://localhost:${PORT}/health`);
    });
  }).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
