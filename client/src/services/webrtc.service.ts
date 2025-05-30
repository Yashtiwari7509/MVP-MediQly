export interface PeerConnectionConfig {
  iceServers: RTCIceServer[];
}

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onIceCandidateCallback?: (candidate: RTCIceCandidate) => void;
  private onConnectionStateChangeCallback?: (
    state: RTCPeerConnectionState
  ) => void;

  private readonly config: PeerConnectionConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun.cloudflare.com:3478" },
    ],
  };

  private readonly mediaConstraints: MediaConstraints = {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      facingMode: "user",
      frameRate: { ideal: 30 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: { ideal: 48000 },
    },
  };

  async initializePeerConnection(): Promise<void> {
    try {
      console.log("Initializing peer connection with config:", this.config);
      this.peerConnection = new RTCPeerConnection(this.config);
      this.setupPeerConnectionEventListeners();
      console.log("Peer connection initialized successfully");
    } catch (error) {
      console.error("Failed to initialize peer connection:", error);
      throw error;
    }
  }

  private setupPeerConnectionEventListeners(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      console.log(
        "ICE candidate event:",
        event.candidate ? "candidate found" : "gathering complete"
      );
      if (event.candidate && this.onIceCandidateCallback) {
        console.log("Sending ICE candidate:", event.candidate);
        this.onIceCandidateCallback(event.candidate);
      }
    };

    this.peerConnection.ontrack = (event) => {
      console.log("Track event received:", event.streams.length, "streams");
      const [remoteStream] = event.streams;

      if (remoteStream && remoteStream.getTracks().length > 0) {
        console.log(
          "Remote stream tracks:",
          remoteStream.getTracks().map((t) => ({
            kind: t.kind,
            enabled: t.enabled,
            readyState: t.readyState,
            id: t.id,
          }))
        );

        this.remoteStream = remoteStream;
        if (this.onRemoteStreamCallback) {
          console.log("Calling remote stream callback");
          this.onRemoteStreamCallback(remoteStream);
        }
      } else {
        console.warn("Remote stream is empty or has no tracks");
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection) {
        const state = this.peerConnection.connectionState;
        console.log("Connection state changed to:", state);

        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback(state);
        }
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection) {
        console.log(
          "ICE connection state:",
          this.peerConnection.iceConnectionState
        );
      }
    };

    this.peerConnection.onsignalingstatechange = () => {
      if (this.peerConnection) {
        console.log("Signaling state:", this.peerConnection.signalingState);
      }
    };
  }

  async getUserMedia(constraints?: MediaConstraints): Promise<MediaStream> {
    try {
      console.log(
        "Requesting user media with constraints:",
        constraints || this.mediaConstraints
      );

      const stream = await navigator.mediaDevices.getUserMedia(
        constraints || this.mediaConstraints
      );

      console.log(
        "User media obtained:",
        stream.getTracks().map((t) => ({
          kind: t.kind,
          enabled: t.enabled,
          readyState: t.readyState,
          id: t.id,
          label: t.label,
        }))
      );

      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error("Failed to get user media:", error);
      throw error;
    }
  }

  addLocalStreamToPeerConnection(): void {
    if (!this.peerConnection || !this.localStream) {
      console.error(
        "Cannot add stream: peer connection or local stream missing"
      );
      return;
    }

    console.log("Adding local stream to peer connection");

    // Remove any existing senders
    const senders = this.peerConnection.getSenders();
    console.log("Removing", senders.length, "existing senders");
    senders.forEach((sender) => {
      try {
        this.peerConnection!.removeTrack(sender);
      } catch (error) {
        console.warn("Error removing sender:", error);
      }
    });

    // Add all tracks from the local stream
    this.localStream.getTracks().forEach((track) => {
      console.log("Adding track to peer connection:", {
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
        id: track.id,
      });

      try {
        const sender = this.peerConnection!.addTrack(track, this.localStream!);
        console.log("Track added successfully, sender:", sender);
      } catch (error) {
        console.error("Error adding track:", error);
      }
    });

    console.log("Local stream added to peer connection successfully");
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    try {
      console.log("Creating offer...");
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      console.log("Offer created, setting local description");
      await this.peerConnection.setLocalDescription(offer);
      console.log("Local description set for offer");

      return offer;
    } catch (error) {
      console.error("Failed to create offer:", error);
      throw error;
    }
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    try {
      console.log("Creating answer...");
      const answer = await this.peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      console.log("Answer created, setting local description");
      await this.peerConnection.setLocalDescription(answer);
      console.log("Local description set for answer");

      return answer;
    } catch (error) {
      console.error("Failed to create answer:", error);
      throw error;
    }
  }

  async setRemoteDescription(
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    try {
      console.log("Setting remote description:", description.type);
      await this.peerConnection.setRemoteDescription(description);
      console.log("Remote description set successfully");
    } catch (error) {
      console.error("Failed to set remote description:", error);
      throw error;
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized");
    }

    try {
      console.log("Adding ICE candidate:", candidate);
      await this.peerConnection.addIceCandidate(candidate);
      console.log("ICE candidate added successfully");
    } catch (error) {
      console.error("Failed to add ICE candidate:", error);
      // Don't throw error for ICE candidate failures as they're common
    }
  }

  toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      console.log("Video toggled:", videoTrack.enabled);
      return videoTrack.enabled;
    }
    return false;
  }

  toggleAudio(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      console.log("Audio toggled:", audioTrack.enabled);
      return audioTrack.enabled;
    }
    return false;
  }

  endCall(): void {
    console.log("Ending call - cleaning up resources");

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        console.log("Stopping local track:", track.kind);
        track.stop();
      });
      this.localStream = null;
    }

    if (this.peerConnection) {
      console.log("Closing peer connection");
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    console.log("Call ended - all resources cleaned up");
  }

  setOnRemoteStream(callback: (stream: MediaStream) => void): void {
    this.onRemoteStreamCallback = callback;
  }

  setOnIceCandidate(callback: (candidate: RTCIceCandidate) => void): void {
    this.onIceCandidateCallback = callback;
  }

  setOnConnectionStateChange(
    callback: (state: RTCPeerConnectionState) => void
  ): void {
    this.onConnectionStateChangeCallback = callback;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }

  isPeerConnectionInitialized(): boolean {
    return this.peerConnection !== null;
  }
}
