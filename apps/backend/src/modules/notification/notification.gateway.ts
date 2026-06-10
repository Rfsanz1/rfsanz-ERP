import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      this.logger.warn('Socket connection rejected: missing auth token');
      client.emit('error', { message: 'Authentication required' });
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'change-this-secret',
      }) as { sub: string; email: string };

      if (!payload?.email) {
        throw new Error('Token missing email claim');
      }

      client.data.user = payload;
      client.join(`notification:${payload.email}`);
      client.emit('connection:accepted', { message: 'Realtime notification gateway connected' });
      this.logger.log(`Socket connected for ${payload.email}`);
    } catch (error) {
      this.logger.warn(`Socket auth failed: ${(error as Error).message}`);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  broadcastNotification(payload: { recipient: string; title: string; message: string }) {
    this.server.to(`notification:${payload.recipient}`).emit(`notification:${payload.recipient}`, payload);
  }
}
