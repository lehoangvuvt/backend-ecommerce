import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import {Server, Socket} from 'socket.io'

@WebSocketGateway(6122)
export class PrismGateWay {
    @WebSocketServer()
    server: Server;

    async handleConnection(socket: Socket) {
        console.log(1);
        console.log(socket);
    }

    @SubscribeMessage('newOrder') 
    handleMessage(@MessageBody() data: string): string {
        console.log(data);
        return "abcdef";
    }
}