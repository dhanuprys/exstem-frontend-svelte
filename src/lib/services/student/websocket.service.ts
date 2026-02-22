import { API_BASE_URL } from '$lib/utils/api';
import { STORAGE_KEYS } from '$lib/utils/constants';
import type {
	WSRequest,
	WSResponse,
	WSSuccessResponse,
	WSGradedResponse,
	WSErrorResponse
} from '$lib/types/websocket';
import type { CheatPayload } from '$lib/types/cheat';

// ─── Types ───────────────────────────────────────────────────────────

export interface WebSocketCallbacks {
	onSaved?: (data: WSSuccessResponse) => void;
	onGraded?: (data: WSGradedResponse) => void;
	onError?: (error: string) => void;
	onClose?: () => void;
	onOpen?: () => void;
}

// ─── Service ─────────────────────────────────────────────────────────

/**
 * Typed WebSocket client for real-time exam autosave and submission.
 * Mirrors the Go backend ws_handler.go protocol.
 */
class ExamWebSocketService {
	private socket: WebSocket | null = null;
	private callbacks: WebSocketCallbacks = {};
	private examId: string = '';
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 5;
	private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	private pingInterval: ReturnType<typeof setInterval> | null = null;
	private intentionalClose = false;

	/** Connect to the exam WebSocket stream. */
	connect(examId: string, callbacks: WebSocketCallbacks): void {
		this.examId = examId;
		this.callbacks = callbacks;
		this.intentionalClose = false;
		this.reconnectAttempts = 0;
		this.establishConnection();
	}

	/** Disconnect from the WebSocket stream. */
	disconnect(): void {
		this.intentionalClose = true;
		this.cleanup();
	}

	/** Send cheat payload to the server. */
	sendCheatReport(payload: CheatPayload): void {
		this.send({ action: 'cheat', payload: JSON.stringify(payload) });
	}

	/** Send an autosave request for a single question answer. */
	sendAutosave(questionId: string, answer: string | null): void {
		this.send({ action: 'autosave', q_id: questionId, ans: answer });
	}

	/** Send a submit request to finish and grade the exam. */
	sendSubmit(): void {
		this.send({ action: 'submit' });
	}

	/** Check if the WebSocket is currently connected. */
	get isConnected(): boolean {
		return this.socket?.readyState === WebSocket.OPEN;
	}

	// ─── Private ─────────────────────────────────────────────────────

	private establishConnection(): void {
		const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
		if (!token) {
			this.callbacks.onError?.('No auth token found');
			return;
		}

		// Build WebSocket URL from API base (http→ws, https→wss).
		const wsBase = API_BASE_URL.replace(/^http/, 'ws').replace(/\/$/, '');
		const url = `${wsBase}/ws/v1/student/exams/${this.examId}/stream?token=${token}`;

		this.socket = new WebSocket(url);

		this.socket.onopen = () => {
			this.reconnectAttempts = 0;
			this.startPingInterval();
			this.callbacks.onOpen?.();
		};

		this.socket.onmessage = (event: MessageEvent) => {
			this.handleMessage(event.data);
		};

		this.socket.onclose = () => {
			this.stopPingInterval();
			this.callbacks.onClose?.();

			if (!this.intentionalClose) {
				this.attemptReconnect();
			}
		};

		this.socket.onerror = () => {
			// The close handler will fire after error, so reconnection is handled there.
		};
	}

	private handleMessage(raw: string): void {
		let msg: WSResponse;
		try {
			msg = JSON.parse(raw) as WSResponse;
		} catch {
			this.callbacks.onError?.('Failed to parse server message');
			return;
		}

		// Discriminated union narrowing on the `event` field.
		switch (msg.event) {
			case 'success':
				this.callbacks.onSaved?.(msg);
				break;
			case 'graded':
				this.callbacks.onGraded?.(msg);
				break;
			case 'error':
				this.callbacks.onError?.((msg as WSErrorResponse).error);
				break;
			case 'pong':
				// Heartbeat acknowledged, nothing to do.
				break;
			default:
				console.warn('[WS] Unknown event:', msg);
		}
	}

	private send(payload: WSRequest): void {
		if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
			console.warn('[WS] Cannot send, socket not open');
			return;
		}
		this.socket.send(JSON.stringify(payload));
	}

	private attemptReconnect(): void {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			this.callbacks.onError?.('Connection lost. Please refresh the page.');
			return;
		}

		this.reconnectAttempts++;
		const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 16000);
		console.log(
			`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
		);

		this.reconnectTimeout = setTimeout(() => {
			this.establishConnection();
		}, delay);
	}

	private startPingInterval(): void {
		// Send a ping every 2 minutes to keep the connection alive.
		this.pingInterval = setInterval(() => {
			this.send({ action: 'ping' });
		}, 120_000);
	}

	private stopPingInterval(): void {
		if (this.pingInterval) {
			clearInterval(this.pingInterval);
			this.pingInterval = null;
		}
	}

	private cleanup(): void {
		this.stopPingInterval();
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	}
}

export const examWebSocketService = new ExamWebSocketService();
