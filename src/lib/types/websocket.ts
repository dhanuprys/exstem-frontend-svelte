// ─── WebSocket Protocol Types ────────────────────────────────────────
// These types mirror the Go structs in internal/websocket/schema.go.
// Keep them in sync when modifying the WebSocket protocol.

// ── Actions (Client → Server) ───────────────────────────────────────

export type WSAction = 'autosave' | 'submit' | 'ping' | 'cheat';

/** Sent by the client to save a single answer. */
export interface WSAutosaveRequest {
	action: 'autosave';
	q_id: string;
	ans: string | null;
}

/** Sent by the client to finish and grade the exam. */
export interface WSSubmitRequest {
	action: 'submit';
}

/** Sent by the client to keep the connection alive. */
export interface WSPingRequest {
	action: 'ping';
}

/** Sent by the client to report a cheat. */
export interface WSCheatRequest {
	action: 'cheat';
	payload: string; // stringified CheatPayload
}

export type WSRequest = WSAutosaveRequest | WSSubmitRequest | WSPingRequest | WSCheatRequest;

// ── Events (Server → Client) ───────────────────────────────────────

export type WSEvent = 'success' | 'graded' | 'error' | 'pong';

/** Confirms a single answer was saved. */
export interface WSSuccessResponse {
	event: 'success';
	status: string;
}

/** Contains the final score after exam submission. */
export interface WSGradedResponse {
	event: 'graded';
	status: string;
	score: number;
}

/** Communicates an error to the client. */
export interface WSErrorResponse {
	event: 'error';
	error: string;
}

/** Acknowledges a ping from the client. */
export interface WSPongResponse {
	event: 'pong';
}

export type WSResponse = WSSuccessResponse | WSGradedResponse | WSErrorResponse | WSPongResponse;
