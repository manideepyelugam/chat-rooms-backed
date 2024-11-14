import express from 'express'
import {Server} from 'socket.io'

import http from 'http';




const port = process.env.PORT || 3000;
const app = express()

const server = http.createServer(app); // Use HTTP for compatibility with Render's SSL

const io = new Server(server,{
    cors:{
        origin: "https://chat-rooms-simple.vercel.app", // Adjust this to match your frontend URL
        methods: ["GET", "POST"]
    }
})


const rooms = {};


io.on("connection",(socket) => {
    console.log(`new socket created ${socket.id}`);

    socket.on("room-create",(roomCode) => {
            if(!rooms[roomCode]){
                rooms[roomCode] = [];
                socket.join(roomCode);
                rooms[roomCode].push(socket.id);
                socket.emit("room-created", roomCode);
                console.log(`room created with room id ${roomCode}`);                

            }else{
               socket.emit("room-error","room already exists");
            }
    })


    socket.on("join-room",(roomCode) => {
        console.log(roomCode,rooms);
        
        if(rooms[roomCode]){
            socket.join(roomCode);
            rooms[roomCode].push(socket.id);
            console.log(`member joined in ${roomCode}`);
            socket.emit("joined-room",roomCode)
        }else{
            socket.emit("room-error","room does not exist")
        }
    })


    socket.on("send-message",({roomCode,username,msg}) => {
        if(rooms[roomCode]){
            io.to(roomCode).emit("recieve-message",({msg,username,id:socket.id}))
        }
    })


    socket.on("disconnect",(roomCode) => {
        for(const room in rooms){
            rooms[room] = rooms[room].filter((id) => id != socket.id);

            if(rooms[room].length === 0){
                delete rooms[room];
                console.log(`${rooms[room]}room deleter`);
            }            
        }
        console.log(`${socket.id} disconnected from room`);
    })


    socket.on("delete",(roomCode) => {
        if(rooms[roomCode]){
                    io.to(roomCode).emit("room-deleted", "This room has been deleted by the host.");

            for (const user in rooms[roomCode]) {
                 io.sockets.sockets.get(user.id)?.leave(roomCode);
            }

            delete rooms[roomCode];
        }else{
            socket.emit('room-error',"room doesn't exist or can be deleted")
        }
    })
    
})

server.listen(port, () => {
    console.log(`server listening on ${port}`);
});
