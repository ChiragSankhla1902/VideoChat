import React,{useState,useEffect,useRef} from 'react';
import './App.css';
import Button from '@mui/material/Button'
import IconButton from "@mui/material/IconButton"
import TextField from "@mui/material/TextField"
// import AssignmentIcon from '@mui/icons-material/Assignment';
// import PhoneIcon from "@mui/icons-material/Phone"
import Peer from 'simple-peer'
import io from 'socket.io-client'
import { CopyToClipboard } from "react-copy-to-clipboard"


const socket=io.connect(process.env.REACT_APP_BACKEND_URL)

function App() {
  const [Me,setMe]=useState('')
  const [stream,setStream]=useState()
  const [Signal,setSignal]=useState()
  const [RecieveCall,setRecieveCall]=useState(false)
  const [Caller,setCaller]=useState("")
  const [CallAccepted,setCallAccepted]=useState(false)
  const [IdToCall,setIdToCall] = useState("")
  const [CallEnd,setCallEnd] =useState(false)
  const [Name,setName]=useState('')
  const MyVideo=useRef();
  const UserVideo=useRef();
  const ConnectionRef=useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({video:true,audio:true}).then((stream)=>{
      setStream(stream);
      MyVideo.current.srcObject=stream;
    })
	.catch((error)=>{console.log(error,'error')})


    socket.on("Me",(id)=>{console.log(id,'id') ; setMe(id)})
    socket.on('CallUser',(data)=>{
      setRecieveCall(true)
      setCaller(data.from)
      setName(data.name)
      setSignal(data.signal)
	  
    })

  }, [])
  console.log(stream,'stream')

  const callUser=(id)=>{
    const peer=new Peer({
      initiator:true,
      trickle:false,
      stream:stream
    })
    peer.on("signal", (data) => {
			socket.emit("CallUser", {
				UserToCall: id,
				signalData: data,
				from: Me,
				name: Name
			})
			
		})
		peer.on("stream", (stream) => {
				UserVideo.current.srcObject = stream
		})
		socket.on("CallAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		ConnectionRef.current = peer

  }
  const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			
			socket.emit("AnswerCall", { signal: data, to: Caller })
		})
		peer.on("stream", (stream) => {
			UserVideo.current.srcObject = stream
		})

		peer.signal(Signal)
		ConnectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnd(true)
		ConnectionRef.current.destroy()
	}

  return (
    <>
    
		<div className="container">
			<div className="video-container">
				<div className="video">
					{stream &&  <video playsInline muted ref={MyVideo} autoPlay style={{ width: "300px" }} />}
				</div>
				<div className="video">
					{CallAccepted && !CallEnd ?
					<video playsInline ref={UserVideo} autoPlay style={{ width: "300px"}} />:
					null}
				</div>
			</div>
			<div className="myId">
				<TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					value={Name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
				/>
				<CopyToClipboard text={Me} style={{ marginBottom: "2rem" }}>
					<Button variant="contained" color="primary">
						Copy ID
					</Button>
				</CopyToClipboard>

				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={IdToCall}
					onChange={(e) => setIdToCall(e.target.value)}
				/>
				<div className="call-button">
					{CallAccepted && !CallEnd ? (
						<Button variant="contained" color="secondary" onClick={leaveCall}>
							End Call
						</Button>
					) : (
						<IconButton color="primary" aria-label="call" onClick={() => callUser(IdToCall)}>
							<Button variant='filled'>PhoneICon</Button>
						</IconButton>
					)}
					{IdToCall}
				</div>
			</div>
			<div>
				{RecieveCall && !CallAccepted ? (
						<div className="caller">
						<h1 >{Name} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
					</div>
				) : null}
			</div>
		</div>
    </>
  );
}

export default App;
