// Motor de conexion WebRTC P2P en tiempo real para Duelos PvP ($0 Costo)

import { P2PDataPacket, DuelType } from '../components/duelo-rapido/dueloTypes';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export class P2PDuelService {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private pollingTimer: number | null = null;
  private isHost: boolean = false;
  private roomId: string | null = null;

  // Callbacks de eventos
  public onConnected: (() => void) | null = null;
  public onPacket: ((packet: P2PDataPacket) => void) | null = null;
  public onDisconnected: (() => void) | null = null;
  public onError: ((err: string) => void) | null = null;

  // 1. El Retador crea la sala y genera la oferta SDP
  async createRoom(
    challengerCode: string,
    opponentCode: string,
    targetNote: string,
    duelType: DuelType = 'pitch_duel'
  ): Promise<string> {
    this.close();
    this.isHost = true;

    try {
      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // Crear canal de datos P2P
      this.dataChannel = this.peerConnection.createDataChannel('laclave-pvp', {
        ordered: false,
        maxRetransmits: 0 // Priorizar velocidad y latencia ultra baja para audio
      });

      this.setupDataChannel(this.dataChannel);

      // Crear SDP Offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Esperar candidatos ICE iniciales o resolver
      await this.waitForIceGathering(this.peerConnection);

      const localSdp = JSON.stringify(this.peerConnection.localDescription);

      // Publicar en D1
      const res = await fetch('/api/duel/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          challengerCode,
          opponentCode,
          targetNote,
          offerSdp: localSdp,
          duelType
        })
      });

      const data = await res.json();
      if (!data.success || !data.roomId) {
        throw new Error(data.error || 'No se pudo crear la sala');
      }

      this.roomId = data.roomId;

      // Iniciar polling ligero para esperar la respuesta (Answer) de tu amigo
      this.startAnswerPolling(data.roomId);

      return data.roomId;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al crear sala P2P';
      this.onError?.(msg);
      throw e;
    }
  }

  // 2. El Oponente se une a la sala y responde con SDP Answer
  async joinRoom(roomId: string, opponentCode: string): Promise<void> {
    this.close();
    this.isHost = false;
    this.roomId = roomId;

    try {
      // Obtener oferta de la sala en D1
      const roomRes = await fetch(`/api/duel/room?roomId=${roomId}`);
      if (!roomRes.ok) throw new Error('Sala no encontrada');

      const roomData = await roomRes.json();
      if (!roomData.success || !roomData.room?.offer_sdp) {
        throw new Error('Oferta de duelo invalida o expirada');
      }

      const offerObj = JSON.parse(roomData.room.offer_sdp);

      this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannel(this.dataChannel);
      };

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerObj));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      await this.waitForIceGathering(this.peerConnection);

      const localAnswerSdp = JSON.stringify(this.peerConnection.localDescription);

      // Enviar respuesta a D1
      await fetch('/api/duel/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          roomId,
          opponentCode,
          answerSdp: localAnswerSdp
        })
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al unirse al duelo';
      this.onError?.(msg);
      throw e;
    }
  }

  // 3. Enviar paquete de datos en vivo (pitch, ritmo, juego o finalizacion)
  sendPacket(packet: P2PDataPacket): boolean {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return false;
    }

    try {
      this.dataChannel.send(JSON.stringify(packet));
      return true;
    } catch {
      return false;
    }
  }

  // Polling de respuesta para el Host (esperando que el amigo acepte)
  private startAnswerPolling(roomId: string) {
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos maximo de espera

    this.pollingTimer = window.setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        this.stopPolling();
        this.onError?.('El oponente no se conecto a tiempo');
        return;
      }

      try {
        const res = await fetch(`/api/duel/room?roomId=${roomId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.success && data.room?.answer_sdp && this.peerConnection) {
          this.stopPolling();
          const answerObj = JSON.parse(data.room.answer_sdp);
          if (this.peerConnection.signalingState !== 'stable') {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerObj));
          }
        }
      } catch {
        // Reintentar en siguiente ciclo
      }
    }, 1000);
  }

  private stopPolling() {
    if (this.pollingTimer !== null) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    channel.onopen = () => {
      this.stopPolling();
      this.onConnected?.();
    };

    channel.onclose = () => {
      this.onDisconnected?.();
    };

    channel.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data) as P2PDataPacket;
        this.onPacket?.(packet);
      } catch {
        // Paquete corrupto ignorado
      }
    };
  }

  private waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
    if (pc.iceGatheringState === 'complete') {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const checkState = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      };
      pc.addEventListener('icegatheringstatechange', checkState);
      // Timeout de seguridad en caso de red lenta
      setTimeout(() => {
        pc.removeEventListener('icegatheringstatechange', checkState);
        resolve();
      }, 1500);
    });
  }

  close() {
    this.stopPolling();

    if (this.dataChannel) {
      try { this.dataChannel.close(); } catch {}
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      try { this.peerConnection.close(); } catch {}
      this.peerConnection = null;
    }

    this.roomId = null;
    this.isHost = false;
  }
}

export const p2pDuelService = new P2PDuelService();
