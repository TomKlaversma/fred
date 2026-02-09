import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

export interface AuthenticatedSocket extends Socket {
  data: {
    companyId?: string;
    userId?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: AuthenticatedSocket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-company')
  handleJoinCompany(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { companyId: string },
  ): void {
    const room = `company:${data.companyId}`;
    client.join(room);
    client.data.companyId = data.companyId;
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('leave-company')
  handleLeaveCompany(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { companyId: string },
  ): void {
    const room = `company:${data.companyId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
  }

  /** Emit a lead:created event to all clients in the company room */
  emitLeadCreated(companyId: string, lead: Record<string, unknown>): void {
    this.server.to(`company:${companyId}`).emit('lead:created', lead);
  }

  /** Emit a lead:updated event to all clients in the company room */
  emitLeadUpdated(companyId: string, lead: Record<string, unknown>): void {
    this.server.to(`company:${companyId}`).emit('lead:updated', lead);
  }

  /** Emit a pipeline status event to all clients in the company room */
  emitPipelineStatus(
    companyId: string,
    status: Record<string, unknown>,
  ): void {
    this.server.to(`company:${companyId}`).emit('pipeline:status', status);
  }

  /** Emit a pipeline job completed event */
  emitPipelineJobCompleted(
    companyId: string,
    job: Record<string, unknown>,
  ): void {
    this.server
      .to(`company:${companyId}`)
      .emit('pipeline:job-completed', job);
  }

  /** Emit a pipeline job failed event */
  emitPipelineJobFailed(
    companyId: string,
    job: Record<string, unknown>,
  ): void {
    this.server.to(`company:${companyId}`).emit('pipeline:job-failed', job);
  }
}
