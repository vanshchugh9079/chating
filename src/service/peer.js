class PeerService {
    constructor() {
        if (!this.peer) {
            this.peer = new RTCPeerConnection({
                iceServers: [
                    { urls: [
                        'stun:stun.l.google.com:19302',
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302',
                        'stun:stun3.l.google.com:19302',
                        'stun:stun4.l.google.com:19302',
                    ]}
                ]
            });
        }
    }
    async getAnswer (offer){
        if(!this.peer) return;
        await this.peer.setRemoteDescription(offer)
        const answer = await this.peer.createAnswer();
        await this.peer.setLocalDescription(new RTCSessionDescription(answer));
        return answer;
    }
    async getOffer() {
        if (this.peer) {
            console.log(this.peer);
            
            let offer = await this.peer.createOffer();
            await this.peer.setLocalDescription(offer);
            return offer;
        }
        return null;
    }
}

export default new PeerService();
