/**
 *
 * client
 *
 */
import { Sink, ID, Disposable } from './types';
import { SubscribePayload } from './message';
export * from './message';
export * from './protocol';
export declare type EventConnecting = 'connecting';
export declare type EventConnected = 'connected';
export declare type EventClosed = 'closed';
export declare type Event = EventConnecting | EventConnected | EventClosed;
/**
 * The first argument is actually the `WebSocket`, but to avoid
 * bundling DOM typings because the client can run in Node env too,
 * you should assert the websocket type during implementation.
 *
 * Also, the second argument is the optional payload that the server may
 * send through the `ConnectionAck` message.
 */
export declare type EventConnectedListener = (socket: unknown, payload?: Record<string, unknown>) => void;
export declare type EventConnectingListener = () => void;
/**
 * The argument is actually the websocket `CloseEvent`, but to avoid
 * bundling DOM typings because the client can run in Node env too,
 * you should assert the websocket type during implementation.
 */
export declare type EventClosedListener = (event: unknown) => void;
export declare type EventListener<E extends Event> = E extends EventConnecting ? EventConnectingListener : E extends EventConnected ? EventConnectedListener : E extends EventClosed ? EventClosedListener : never;
/** Configuration used for the GraphQL over WebSocket client. */
export interface ClientOptions {
    /** URL of the GraphQL over WebSocket Protocol compliant server to connect. */
    url: string;
    /**
     * Optional parameters, passed through the `payload` field with the `ConnectionInit` message,
     * that the client specifies when establishing a connection with the server. You can use this
     * for securely passing arguments for authentication.
     *
     * If you decide to return a promise, keep in mind that the server might kick you off if it
     * takes too long to resolve! Check the `connectionInitWaitTimeout` on the server for more info.
     *
     * Throwing an error from within this function will close the socket with the `Error` message
     * in the close event reason.
     */
    connectionParams?: Record<string, unknown> | (() => Promise<Record<string, unknown>> | Record<string, unknown>);
    /**
     * Should the connection be established immediately and persisted
     * or after the first listener subscribed.
     *
     * @default true
     */
    lazy?: boolean;
    /**
     * Used ONLY when the client is in non-lazy mode (`lazy = false`). When
     * using this mode, the errors might have no sinks to report to; however,
     * to avoid swallowing errors, consider using `onNonLazyError`,  which will
     * be called when either:
     * - An unrecoverable error/close event occurs
     * - Silent retry attempts have been exceeded
     *
     * After a client has errored out, it will NOT perform any automatic actions.
     *
     * The argument can be a websocket `CloseEvent` or an `Error`. To avoid bundling
     * DOM types, you should derive and assert the correct type. When receiving:
     * - A `CloseEvent`: retry attempts have been exceeded or the specific
     * close event is labeled as fatal (read more in `retryAttempts`).
     * - An `Error`: some internal issue has occured, all internal errors are
     * fatal by nature.
     *
     * @default console.error
     */
    onNonLazyError?: (errorOrCloseEvent: unknown) => void;
    /**
     * How long should the client wait before closing the socket after the last oparation has
     * completed. This is meant to be used in combination with `lazy`. You might want to have
     * a calmdown time before actually closing the connection. Kinda' like a lazy close "debounce".
     *
     * @default 0 // close immediately
     */
    keepAlive?: number;
    /**
     * How many times should the client try to reconnect on abnormal socket closure before it errors out?
     *
     * The library classifies the following close events as fatal:
     * - `1002: Protocol Error`
     * - `1011: Internal Error`
     * - `4400: Bad Request`
     * - `4401: Unauthorized` _tried subscribing before connect ack_
     * - `4409: Subscriber for <id> already exists` _distinction is very important_
     * - `4429: Too many initialisation requests`
     *
     * These events are reported immediately and the client will not reconnect.
     *
     * @default 5
     */
    retryAttempts?: number;
    /**
     * Control the wait time between retries. You may implement your own strategy
     * by timing the resolution of the returned promise with the retries count.
     * `retries` argument counts actual connection attempts, so it will begin with
     * 0 after the first retryable disconnect.
     *
     * @default Randomised exponential backoff
     */
    retryWait?: (retries: number) => Promise<void>;
    /**
     * Register listeners before initialising the client. This way
     * you can ensure to catch all client relevant emitted events.
     *
     * The listeners passed in will **always** be the first ones
     * to get the emitted event before other registered listeners.
     */
    on?: Partial<{
        [event in Event]: EventListener<event>;
    }>;
    /**
     * A custom WebSocket implementation to use instead of the
     * one provided by the global scope. Mostly useful for when
     * using the client outside of the browser environment.
     */
    webSocketImpl?: unknown;
    /**
     * A custom ID generator for identifying subscriptions.
     *
     * The default generates a v4 UUID to be used as the ID using `Math`
     * as the random number generator. Supply your own generator
     * in case you need more uniqueness.
     *
     * Reference: https://stackoverflow.com/a/2117523/709884
     */
    generateID?: () => ID;
}
export interface Client extends Disposable {
    /**
     * Listens on the client which dispatches events about the socket state.
     */
    on<E extends Event>(event: E, listener: EventListener<E>): () => void;
    /**
     * Subscribes through the WebSocket following the config parameters. It
     * uses the `sink` to emit received data or errors. Returns a _cleanup_
     * function used for dropping the subscription and cleaning stuff up.
     */
    subscribe<T = unknown>(payload: SubscribePayload, sink: Sink<T>): () => void;
}
/** Creates a disposable GraphQL over WebSocket client. */
export declare function createClient(options: ClientOptions): Client;
