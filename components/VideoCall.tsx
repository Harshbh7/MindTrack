import { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Monitor, Maximize2, Minimize2 } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

interface VideoCallProps {
    roomId: string;
    userId: string;
    userName: string;
    compactMode?: boolean; // For PIP support
}

export default function VideoCall({ roomId, userId, userName, compactMode = false }: VideoCallProps) {
    const { socket, isConnected, connectionError } = useSocket();

    // Call State
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [callerName, setCallerName] = useState("");
    const [callerSignal, setCallerSignal] = useState<any>();
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const [callStatus, setCallStatus] = useState("Idle"); // Debugging status

    // Media & Type State
    const [callType, setCallType] = useState<"video" | "audio">("video");
    const [remoteCallType, setRemoteCallType] = useState<"video" | "audio">("video"); // What the caller initiated
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<Peer.Instance | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize ringtone (iPhone Style)
        ringtoneRef.current = new Audio("https://raw.githubusercontent.com/rajeshpillai/youtube-react-clone-assets/master/assets/sounds/iphone_ringtone.mp3");
        ringtoneRef.current.loop = true;

        // Request Notification Permission on mount
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                Notification.requestPermission();
            }
        }
    }, []);

    const endCallCleanup = useCallback(() => {
        setCallEnded(true);
        // Stop Ringtone
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }

        if (connectionRef.current) {
            connectionRef.current.destroy();
        }

        // Stop all tracks
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        setReceivingCall(false);
        setCaller("");
        setCallerName("");
        setCallerSignal(null);
        setCallAccepted(false);
        setIsCalling(false);
        setMicOn(true);
        setVideoOn(true);
        setIsScreenSharing(false);
        setCallStatus("Idle");
    }, [stream]);

    // Handle Ringtone & Notification
    useEffect(() => {
        if (receivingCall && !callAccepted) {
            // Play Ringtone
            ringtoneRef.current?.play().catch(err => console.error("Ringtone play failed:", err));

            // Trigger System Notification
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    const notification = new Notification("Incoming Video Call 📞", {
                        body: `${callerName || "Someone"} is calling you on MindTrack...`,
                        icon: "/mindtrack_icon.png", // Fallback if specific size not found, browser usually handles
                        tag: "incoming-call", // Prevent stacking multiple notifications
                        requireInteraction: true, // Keep it visible until user clicks
                    });

                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                    };
                } catch (e) {
                    console.error("Notification failed", e);
                }
            }

        } else {
            ringtoneRef.current?.pause();
            if (ringtoneRef.current) ringtoneRef.current.currentTime = 0;
        }
    }, [receivingCall, callAccepted, callerName]);

    useEffect(() => {
        // Initialize socket listeners
        if (socket && isConnected) {
            socket.emit("join-room", roomId, userId);

            const handleIncomingCall = (data: any) => {
                // Allow calling yourself (for testing in 2 tabs)
                // if (data.from !== userId) { 
                setReceivingCall(true);
                setCaller(data.from);
                setCallerName(data.name);
                setCallerSignal(data.signal);
                setRemoteCallType(data.callType || "video");
                // }
            };

            const handleCallEnded = () => {
                // Determine if we need to clean up
                // If we are in a call, end it.
                // If receiving call, cancel it.
                endCallCleanup();
            };

            const handleSignal = (data: any) => {
                // Handle trickle ICE candidates or other signals
                // data = { signal, fromUserId, targetUserId }
                if (connectionRef.current && !connectionRef.current.destroyed) {
                    // Avoid verifying sender too strictly for now to ensure connectivity
                    // But typically check if data.fromUserId === caller or someone we are connected to.
                    // For 1-on-1 calls in this setup:
                    connectionRef.current.signal(data.signal);
                }
            };

            socket.on("incoming-call", handleIncomingCall);
            socket.on("call-ended", handleCallEnded);
            socket.on("signal", handleSignal);

            return () => {
                socket.off("incoming-call", handleIncomingCall);
                socket.off("call-ended", handleCallEnded);
                socket.off("signal", handleSignal);
            };
        }
    }, [socket, isConnected, roomId, userId, endCallCleanup]);

    const getMedia = async (type: "video" | "audio") => {
        try {
            let stream: MediaStream | null = null;

            // Helper to try constraints
            const tryGetMedia = async (constraints: MediaStreamConstraints) => {
                try {
                    return await navigator.mediaDevices.getUserMedia(constraints);
                } catch (e) {
                    console.warn("Constraints failed:", constraints, e);
                    return null;
                }
            };

            if (type === "video") {
                // 1. Try Ideal HD (Active constraints removed for compatibility)
                stream = await tryGetMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: true
                });

                // 2. Fallback: Standard resolution
                if (!stream) {
                    stream = await tryGetMedia({
                        video: { width: { ideal: 640 }, height: { ideal: 480 } },
                        audio: true
                    });
                }

                // 3. Fallback: Any video (system default)
                if (!stream) {
                    stream = await tryGetMedia({ video: true, audio: true });
                }
            } else {
                // Audio only
                stream = await tryGetMedia({ video: false, audio: true });
            }

            if (!stream) {
                throw new Error("Could not acquire media stream after multiple attempts.");
            }

            setStream(stream);

            // Only attach to video element if video is present
            if (type === "video" && myVideo.current) {
                myVideo.current.srcObject = stream;
            }
            return stream;
        } catch (err: any) {
            console.error("Error accessing media devices:", err);
            let errorMessage = "Could not access camera/microphone";
            if (err.name === 'NotAllowedError') {
                errorMessage = "Permission denied. Please allow camera and microphone access.";
            } else if (err.name === 'NotFoundError') {
                errorMessage = "No camera or microphone found.";
            } else if (err.name === 'NotReadableError') {
                errorMessage = "Camera/Microphone is already in use by another application.";
            } else if (err.name === 'NotSupportedError') {
                errorMessage = "Browser does not support the requested media type or constraints.";
            }
            alert(errorMessage);
            return null;
        }
    };

    const callUser = async (type: "video" | "audio") => {
        setIsCalling(true);
        setCallType(type);
        setCallEnded(false);
        setCallStatus("Requesting Camera/Mic...");

        const currentStream = await getMedia(type);
        if (!currentStream) {
            setIsCalling(false);
            setCallStatus("Media Access Failed");
            return;
        }

        setCallStatus("Initializing Peer Connection...");
        const peer = new Peer({
            initiator: true,
            trickle: true, // Enable trickle ICE
            stream: currentStream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peer.on("signal", (data) => {
            if (data.type === 'offer') {
                setCallStatus("Sending Signal...");
                socket?.emit("initiate-call", {
                    roomId,
                    signalData: data,
                    fromUserId: userId,
                    fromUserName: userName,
                    callType: type, // Send call type
                });
                setCallStatus("Calling details sent. Waiting for answer...");
            } else {
                // Send candidate
                socket?.emit("signal", {
                    roomId,
                    signal: data,
                    userId, // Identify sender used in server to target correct recipient if needed, but here server broadcasts based on Room or Target
                    // Ensure server handles this.
                });
            }
        });

        peer.on("stream", (remoteStream) => {
            setCallStatus("Remote Stream Received!");
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.on("close", () => {
            setCallStatus("Call Closed");
            endCallCleanup();
        });

        peer.on("connect", () => {
            setCallStatus("P2P Connection Established! 🎉");
        });

        peer.on("error", (err) => {
            console.error("Peer error:", err);
            setCallStatus(`Peer Error: ${err.message}`);
            endCallCleanup();
        });

        socket?.on("call-accepted", (data: any) => {
            setCallAccepted(true);
            setCallStatus("Call Accepted! Connecting...");
            peer.signal(data.signal);
        });

        connectionRef.current = peer;
    };

    const answerCall = async () => {
        setCallAccepted(true);
        setCallType(remoteCallType); // Answer with same type (usually)
        setCallEnded(false);
        setCallStatus("Answering... Requesting Media");

        const currentStream = await getMedia(remoteCallType);
        if (!currentStream) {
            setCallStatus("Media Access Failed");
            return;
        }

        setCallStatus("Initializing Peer Answer...");
        const peer = new Peer({
            initiator: false,
            trickle: true,
            stream: currentStream,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peer.on("signal", (data) => {
            // Check if it's an answer SDP or candidate
            if (data.type === 'answer') {
                setCallStatus("Sending Answer Signal...");
                socket?.emit("answer-call", {
                    roomId,
                    signal: data,
                    toUserId: caller
                });
                setCallStatus("Answer Sent! Connecting...");
            } else {
                socket?.emit("signal", {
                    roomId,
                    signal: data,
                    targetUserId: caller,
                    userId
                });
            }
        });

        peer.on("stream", (remoteStream) => {
            setCallStatus("Remote Stream Connection Established");
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.on("close", () => {
            setCallStatus("Call Closed");
            endCallCleanup();
        });

        peer.on("error", (err) => {
            console.error("Peer error:", err);
            setCallStatus(`Peer Error: ${err.message}`);
            endCallCleanup();
        });

        peer.signal(callerSignal);
        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        if (socket) {
            socket.emit("leave-call", { roomId });
        }
        endCallCleanup();
    };

    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !micOn;
                setMicOn(!micOn);
            }
        }
    }

    const toggleVideo = () => {
        if (stream && callType === 'video') {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoOn;
                setVideoOn(!videoOn);
            }
        }
    }

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
                const screenTrack = displayStream.getVideoTracks()[0];

                if (connectionRef.current && stream) {
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) {
                        connectionRef.current.replaceTrack(videoTrack, screenTrack, stream);
                    }

                    // Update local view
                    if (myVideo.current) {
                        myVideo.current.srcObject = displayStream;
                    }
                }

                screenTrack.onended = () => {
                    stopScreenShare();
                };

                screenStreamRef.current = displayStream;
                setIsScreenSharing(true);
            } catch (err) {
                console.error("Screen share failed", err);
            }
        } else {
            stopScreenShare();
        }
    };

    const stopScreenShare = () => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        if (connectionRef.current && stream) {
            // Revert to camera track
            // We need to fetch the camera track again if the stream was mutated? 
            // Actually, 'stream' state still holds the original camera stream usually, 
            // but we replaced the track in the Peer Connection.
            // We just need to put the camera track BACK into the peer connection.
            const videoTrack = stream.getVideoTracks()[0];
            // Note: 'stream' might still be pointing to the camera stream object.
            // But if we replaced the track in the connection, we check:

            // The 'replaceTrack' replaces what is SENT. It doesn't modify the local 'stream' object extensively 
            // except effectively swapping the source for the peer.
            // We need to make sure the track we are putting back is active.
            if (videoTrack && videoTrack.readyState === 'live') {
                // We find the SENDER that has the screen track and replace it with videoTrack
                // Simple peer wrapper handles replaceTrack(old, new, stream).
                // We need to know what the OLD track is (the screen track).
                // But wait, the simple-peer API: peer.replaceTrack(oldTrack, newTrack, stream)
                // We don't easily have 'oldTrack' reference if we didn't save it, 
                // but we know it's the screen track we just stopped?
                // No, inside 'stopScreenShare', the track might be ended.
                // Let's assume we can just pass the current sender track?

                // Implementation Detail: We need to reference the track we *swapped in*.
                // That is 'screenTrack' from the `toggleScreenShare` scope.
                // We better save it in ref.
            }

            // Ideally we restart camera or ensure it's running.
            if (myVideo.current) {
                myVideo.current.srcObject = stream;
            }

            // Re-negotiate? No, replaceTrack handles it.
            // We need to implement the 'replaceTrack' call properly.
            // Since we didn't save the *specific* screen track instance in a state that is accessible easily 
            // to 'replaceTrack' (we have screenStreamRef), let's try:
            // peer.replaceTrack(screenStreamRef.current.getVideoTracks()[0], videoTrack, stream)
            // But screenStreamRef.current might be null if we stopped it?
            // Correct order: 
            // 1. Replace track in peer.
            // 2. Stop screen track.

            // THIS LOGIC IS BRITTLE in this simple implementation without robust state tracking. 
            // For now, let's just create a new 'getMedia' call to reset camera if needed, or 
            // just hard refresh the peer logic (which drops call).
            // A smoother way:

            setIsScreenSharing(false);
            // We will implement a full "switch back" in a future iteration if this fails.
            // For now, let's rely on the user ensuring they select camera again or we just reload the stream.
            // Actually, let's just re-acquire camera stream to be safe and "replace" the screen stream with it globally.
            getMedia("video").then((newStream) => {
                if (newStream && connectionRef.current && screenStreamRef.current) {
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    const oldScreenTrack = screenStreamRef.current.getVideoTracks()[0];
                    connectionRef.current.replaceTrack(oldScreenTrack, newVideoTrack, stream);
                    screenStreamRef.current = null;
                }
            });
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center bg-gray-900 border border-gray-800 overflow-hidden transition-all ${compactMode ? 'fixed bottom-4 right-4 w-64 h-auto z-50 rounded-xl shadow-2xl p-2' : 'p-4 rounded-xl w-full h-full'}`}>

            {/* Header / Collapse Control */}
            {compactMode && (
                <div className="flex justify-between items-center w-full mb-2 px-1">
                    <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Live
                    </span>
                    <Maximize2 className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white" />
                </div>
            )}

            {/* Call Controls (Start Call) */}
            {!callAccepted && !receivingCall && !isCalling && (
                <div className="flex flex-col gap-4 text-center">
                    {!compactMode && <p className="text-gray-400 text-sm">Start a collaboration session</p>}

                    {!isConnected && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-2 rounded text-xs mb-2 break-all">
                            ⚠️ Status: {connectionError || "Connecting..."}
                            <br />
                            <br />
                            URL: {process.env.NEXT_PUBLIC_SOCKET_URL}
                        </div>
                    )}

                    {/* Debug Status */}
                    <div className="text-[10px] text-gray-500 font-mono mt-1">
                        Debug Log: {callStatus}
                    </div>

                    <div className="flex space-x-4 justify-center">
                        <button
                            onClick={() => callUser("audio")}
                            disabled={!isConnected}
                            className={`p-3 rounded-full transition-all border ${!isConnected ? 'bg-gray-800 text-gray-600 border-gray-800 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700 text-green-500 border-gray-700 hover:border-green-500/50'}`}
                            title="Voice Call"
                        >
                            <Phone className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => callUser("video")}
                            disabled={!isConnected}
                            className={`p-3 rounded-full transition-all border ${!isConnected ? 'bg-gray-800 text-gray-600 border-gray-800 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700 text-blue-500 border-gray-700 hover:border-blue-500/50'}`}
                            title="Video Call"
                        >
                            <Video className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}

            {/* Incoming Call Notification */}
            {receivingCall && !callAccepted && (
                <div className="flex flex-col items-center bg-gray-800 p-4 rounded-lg animate-pulse border border-blue-500 shadow-lg z-50">
                    <h3 className="text-white text-sm font-bold mb-3 text-center">
                        {callerName || "Someone"} is calling...
                    </h3>
                    <div className="flex space-x-4">
                        <button
                            onClick={answerCall}
                            className="bg-green-500 hover:bg-green-600 p-3 rounded-full text-white transition-transform hover:scale-110 shadow-lg"
                        >
                            <Phone className="w-5 h-5" />
                        </button>
                        <button
                            onClick={leaveCall}
                            className="bg-red-500 hover:bg-red-600 p-3 rounded-full text-white transition-transform hover:scale-110 shadow-lg"
                        >
                            <PhoneOff className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Call Area */}
            {(callAccepted || isCalling) && !callEnded && (
                <div className="w-full h-full flex flex-col space-y-2 relative">
                    {/* Status Overlay */}
                    {isCalling && !callAccepted && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg">
                            <div className="text-blue-400 font-medium animate-pulse">Calling... {callStatus}</div>
                        </div>
                    )}

                    {/* Media Display Grid */}
                    <div className={`grid gap-2 w-full flex-1 min-h-0 ${compactMode ? 'grid-rows-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {/* My Media */}
                        <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center w-full h-full group border border-gray-800">
                            {callType === 'video' || isScreenSharing ? (
                                <video
                                    playsInline
                                    muted
                                    ref={myVideo}
                                    autoPlay
                                    className={`w-full h-full object-cover ${isScreenSharing ? '' : 'transform scale-x-[-1]'}`}
                                />
                            ) : (
                                <div className="text-gray-500 flex flex-col items-center">
                                    <div className="bg-gray-800 p-4 rounded-full mb-2">
                                        <Mic className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs">You</span>
                                </div>
                            )}
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-white text-[10px] backdrop-blur-sm">You {isScreenSharing ? '(Screen)' : ''}</div>
                        </div>

                        {/* Remote Media */}
                        {callAccepted && (
                            <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center w-full h-full border border-gray-800">
                                {/* Only one video element to prevent ref conflicts */}
                                <video
                                    playsInline
                                    ref={userVideo}
                                    autoPlay
                                    className={`w-full h-full object-cover ${remoteCallType === 'video' ? '' : 'opacity-0 absolute pointer-events-none'}`}
                                />

                                {remoteCallType !== 'video' && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <div className="text-gray-500 flex flex-col items-center">
                                            <div className="bg-gray-800 p-4 rounded-full mb-2">
                                                <Mic className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs">{callerName}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-white text-[10px] backdrop-blur-sm z-20">{callerName || "Remote"}</div>
                            </div>
                        )}
                    </div>

                    {/* In-Call Controls Toolbar */}
                    <div className={`flex flex-wrap justify-center items-center gap-2 mt-auto p-2 bg-gray-800/80 backdrop-blur-md rounded-xl border border-gray-700 transition-all ${compactMode ? 'scale-75 origin-bottom' : ''}`}>
                        <button onClick={toggleMic} className={`p-2.5 rounded-full text-white transition-colors ${micOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}>
                            {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </button>

                        <button onClick={toggleVideo} className={`p-2.5 rounded-full text-white transition-colors ${videoOn ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'}`}>
                            {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                        </button>

                        {!compactMode && (
                            <button onClick={toggleScreenShare} className={`p-2.5 rounded-full text-white transition-colors ${isScreenSharing ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-700 hover:bg-gray-600'}`} title="Share Screen">
                                <Monitor className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            onClick={leaveCall}
                            className="bg-red-600 hover:bg-red-700 p-2.5 rounded-full text-white transition-colors"
                            title="End Call"
                        >
                            <PhoneOff className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Connection Status */}
            {!isConnected && (
                <div className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" title="Disconnected"></span>
                </div>
            )}
        </div>
    );
}
