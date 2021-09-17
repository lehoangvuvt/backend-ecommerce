import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import axios from "axios";
import { Server, Socket } from 'socket.io';

@WebSocketGateway({namespace: '/socket/orders'})
export class OrdersGateway {
    private newOrders: Array<{
        ID: number,
        CREATED_DATETIME: Date,
    }> = [];
    private clients: Map<string, { clientId: string }> = new Map();

    private clientsStore: Map<string, {clientId: string} > = new Map();

    @WebSocketServer()
    server: Server;


    // auth: {
    //     TYPE
    //     SID
    // }
    async handleConnection(socket: Socket) {
        if (socket.handshake && socket.handshake.auth && socket.handshake.auth.SID && socket.handshake.auth.TYPE) {
            if (socket.handshake.auth.TYPE === 'admin')
                this.clients.set(socket.handshake.auth.SID.toString(), { clientId: socket.id });
            else 
                if (socket.handshake.auth.TYPE === 'store')
                    this.clientsStore.set(socket.handshake.auth.SID.toString(), {clientId: socket.id} );
        }
        const response = await axios({
            url: 'http://localhost:5035/orders/new-orders',
            method: "GET",
            withCredentials: true,
        })
        const data = response.data;
        this.newOrders = data;
        for (let [key, value] of this.clients) {
            const SID = key;
            const clientId = value.clientId;
            this.server.to(clientId).emit('newOrders', this.newOrders);
        }
    }

    @SubscribeMessage('newOrders')
    handleMessage(@MessageBody() message: {store: string}): void {
        console.log('Message');
        console.log(message);
        for (let [key, value] of this.clientsStore) {
            const clientId = value.clientId;
            console.log('Sent to: ' + key)
            this.server.to(clientId).emit('newOrders');
        }
    }
}