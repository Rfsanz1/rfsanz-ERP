import { Controller, Get, Post, Param, Body, Query, UseGuards, HttpCode, Request , Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service.js';
import { StrictJwtGuard } from '../guards/strict-jwt.guard.js';

@ApiTags('v1/chat')
@Controller('v1/chat')
@UseGuards(StrictJwtGuard)
export class ChatV1Controller {
  constructor(@Inject(ChatService) private readonly service: ChatService) {}

  @Post('rooms')
  @HttpCode(201)
  createRoom(@Body() body: any) { return this.service.createRoom(body); }

  @Get('rooms')
  getRooms() { return this.service.getRooms(); }

  @Get('rooms/:roomId/messages')
  getMessages(@Param('roomId') roomId: string, @Query() query: any) {
    return this.service.getMessages(roomId, query);
  }

  @Post('rooms/:roomId/messages')
  @HttpCode(201)
  sendMessage(@Param('roomId') roomId: string, @Body() body: any, @Request() req: any) {
    return this.service.createMessage(roomId, req.user.sub, body.body, body.senderName);
  }
}
