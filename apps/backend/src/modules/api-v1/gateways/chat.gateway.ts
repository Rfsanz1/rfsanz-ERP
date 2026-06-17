import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../services/chat.service.js';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`[Chat WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Chat WS] Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.join(data.roomId);
    return { event: 'joined', data: { roomId: data.roomId } };
  }

  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() data: { roomId: string; body: string; senderId?: string; senderName?: string }, @ConnectedSocket() client: Socket) {
    try {
      const message = await this.chatService.createMessage(data.roomId, data.senderId ?? client.id, data.body, data.senderName);
      this.server.to(data.roomId).emit('new_message', { message });
      return { event: 'message_sent', data: message };
    } catch (err: any) {
      return { event: 'error', data: { message: err.message } };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    client.to(data.roomId).emit('user_typing', { userId: client.id, roomId: data.roomId });
  }
}
