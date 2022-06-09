const express=require('express');
const http = require('http');
const app =express();
const cors=require('cors')
const server = http.createServer(app)
const io = require('socket.io')(server,{
    cors:{
        origin:'*',
        methods:['GET','POST']
    }

})

app.use(cors())

const PORT = process.env.PORT || 5000

app.get('/',(req,res)=>{res.send('Running service')})

io.on('connection',(socket)=>{
    socket.emit('Me',socket.id)
    socket.on('Disconnect',()=>{socket.brodcast.emit('Call ended')})
    socket.on('CallUser',(data)=>{io.to(data.UserToCall).emit('CallUser',{signal:data.signalData,from:data.from,name:data.name})})
    socket.on('AnswerCall',(data)=>{ io.to(data.to).emit('CallAccepted',data.signal)})

})

server.listen(PORT,()=>{console.log(`server is running on ${PORT}`)})

