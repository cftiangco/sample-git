import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DBService } from '../persistence/db.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})

export class EventGateway {
  @WebSocketServer()
  server: Server;

  static consumers: any;
  static control: any; 

  db: DBService;  

  constructor(){
    EventGateway.consumers = {};

    DBService.connect((pc) => {
      if (pc.success) {
        this.db = <DBService>pc.result;
      }else{
        console.log('event gateway db disconnected', pc);
      }
    });
  }  

  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: any, @ConnectedSocket() client: Socket): string {
    try {
      console.log(data);
      let action = data.action;
    } catch (e) {
      console.log(e);
    }
    return '';
  }

  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number, @ConnectedSocket() client: Socket): Promise<string> {
    let consumer = {
      identity: data,
      id: this.db.generateKey(),
      client: client
    };
    EventGateway.consumers[consumer.id] = consumer;
    return consumer.id;
  }
}