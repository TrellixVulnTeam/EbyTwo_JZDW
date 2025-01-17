"use strict";
/**
 *
 * server
 *
 */
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeServer = void 0;
const graphql_1 = require("graphql");
const protocol_1 = require("./protocol");
const message_1 = require("./message");
const utils_1 = require("./utils");
/**
 * Makes a Protocol complient WebSocket GraphQL server. The server
 * is actually an API which is to be used with your favourite WebSocket
 * server library!
 *
 * Read more about the Protocol in the PROTOCOL.md documentation file.
 */
function makeServer(options) {
    const { schema, context, roots, execute, subscribe, connectionInitWaitTimeout = 3 * 1000, // 3 seconds
    onConnect, onDisconnect, onClose, onSubscribe, onOperation, onNext, onError, onComplete, } = options;
    return {
        opened(socket, extra) {
            if (socket.protocol !== protocol_1.GRAPHQL_TRANSPORT_WS_PROTOCOL) {
                socket.close(1002, 'Protocol Error');
                return async (code, reason) => {
                    /* nothing was set up, just notify the closure */
                    await (onClose === null || onClose === void 0 ? void 0 : onClose(ctx, code, reason));
                };
            }
            const ctx = {
                connectionInitReceived: false,
                acknowledged: false,
                subscriptions: {},
                extra,
            };
            // kick the client off (close socket) if the connection has
            // not been initialised after the specified wait timeout
            const connectionInitWait = connectionInitWaitTimeout > 0 && isFinite(connectionInitWaitTimeout)
                ? setTimeout(() => {
                    if (!ctx.connectionInitReceived) {
                        socket.close(4408, 'Connection initialisation timeout');
                    }
                }, connectionInitWaitTimeout)
                : null;
            socket.onMessage(async function onMessage(data) {
                var e_1, _a;
                var _b, _c;
                let message;
                try {
                    message = message_1.parseMessage(data);
                }
                catch (err) {
                    return socket.close(4400, 'Invalid message received');
                }
                switch (message.type) {
                    case message_1.MessageType.ConnectionInit: {
                        if (ctx.connectionInitReceived) {
                            return socket.close(4429, 'Too many initialisation requests');
                        }
                        // @ts-expect-error: I can write
                        ctx.connectionInitReceived = true;
                        if (utils_1.isObject(message.payload)) {
                            // @ts-expect-error: I can write
                            ctx.connectionParams = message.payload;
                        }
                        const permittedOrPayload = await (onConnect === null || onConnect === void 0 ? void 0 : onConnect(ctx));
                        if (permittedOrPayload === false) {
                            return socket.close(4403, 'Forbidden');
                        }
                        await socket.send(message_1.stringifyMessage(utils_1.isObject(permittedOrPayload)
                            ? {
                                type: message_1.MessageType.ConnectionAck,
                                payload: permittedOrPayload,
                            }
                            : {
                                type: message_1.MessageType.ConnectionAck,
                            }));
                        // @ts-expect-error: I can write
                        ctx.acknowledged = true;
                        break;
                    }
                    case message_1.MessageType.Subscribe: {
                        if (!ctx.acknowledged) {
                            return socket.close(4401, 'Unauthorized');
                        }
                        const id = message.id;
                        if (id in ctx.subscriptions) {
                            return socket.close(4409, `Subscriber for ${id} already exists`);
                        }
                        // if this turns out to be a streaming operation, the subscription value
                        // will change to an `AsyncIterable`, otherwise it will stay as is
                        ctx.subscriptions[id] = null;
                        const emit = {
                            next: async (result, args) => {
                                let nextMessage = {
                                    id,
                                    type: message_1.MessageType.Next,
                                    payload: result,
                                };
                                if (onNext) {
                                    const maybeResult = await onNext(ctx, nextMessage, args, result);
                                    if (maybeResult) {
                                        nextMessage = Object.assign(Object.assign({}, nextMessage), { payload: maybeResult });
                                    }
                                }
                                await socket.send(message_1.stringifyMessage(nextMessage));
                            },
                            error: async (errors) => {
                                let errorMessage = {
                                    id,
                                    type: message_1.MessageType.Error,
                                    payload: errors,
                                };
                                if (onError) {
                                    const maybeErrors = await onError(ctx, errorMessage, errors);
                                    if (maybeErrors) {
                                        errorMessage = Object.assign(Object.assign({}, errorMessage), { payload: maybeErrors });
                                    }
                                }
                                await socket.send(message_1.stringifyMessage(errorMessage));
                            },
                            complete: async (notifyClient) => {
                                const completeMessage = {
                                    id,
                                    type: message_1.MessageType.Complete,
                                };
                                await (onComplete === null || onComplete === void 0 ? void 0 : onComplete(ctx, completeMessage));
                                if (notifyClient) {
                                    await socket.send(message_1.stringifyMessage(completeMessage));
                                }
                            },
                        };
                        let execArgs;
                        const maybeExecArgsOrErrors = await (onSubscribe === null || onSubscribe === void 0 ? void 0 : onSubscribe(ctx, message));
                        if (maybeExecArgsOrErrors) {
                            if (utils_1.areGraphQLErrors(maybeExecArgsOrErrors)) {
                                return await emit.error(maybeExecArgsOrErrors);
                            }
                            else if (Array.isArray(maybeExecArgsOrErrors)) {
                                throw new Error('Invalid return value from onSubscribe hook, expected an array of GraphQLError objects');
                            }
                            // not errors, is exec args
                            execArgs = maybeExecArgsOrErrors;
                        }
                        else {
                            if (!schema) {
                                // you either provide a schema dynamically through
                                // `onSubscribe` or you set one up during the server setup
                                throw new Error('The GraphQL schema is not provided');
                            }
                            const { operationName, query, variables } = message.payload;
                            execArgs = {
                                schema,
                                operationName,
                                document: graphql_1.parse(query),
                                variableValues: variables,
                            };
                            const validationErrors = graphql_1.validate(execArgs.schema, execArgs.document);
                            if (validationErrors.length > 0) {
                                return await emit.error(validationErrors);
                            }
                        }
                        const operationAST = graphql_1.getOperationAST(execArgs.document, execArgs.operationName);
                        if (!operationAST) {
                            return await emit.error([
                                new graphql_1.GraphQLError('Unable to identify operation'),
                            ]);
                        }
                        // if `onSubscribe` didnt specify a rootValue, inject one
                        if (!('rootValue' in execArgs)) {
                            execArgs.rootValue = roots === null || roots === void 0 ? void 0 : roots[operationAST.operation];
                        }
                        // if `onSubscribe` didn't specify a context, inject one
                        if (!('contextValue' in execArgs)) {
                            execArgs.contextValue =
                                typeof context === 'function'
                                    ? await context(ctx, message, execArgs)
                                    : context;
                        }
                        // the execution arguments have been prepared
                        // perform the operation and act accordingly
                        let operationResult;
                        if (operationAST.operation === 'subscription') {
                            operationResult = await subscribe(execArgs);
                        }
                        else {
                            // operation === 'query' || 'mutation'
                            operationResult = await execute(execArgs);
                        }
                        if (onOperation) {
                            const maybeResult = await onOperation(ctx, message, execArgs, operationResult);
                            if (maybeResult) {
                                operationResult = maybeResult;
                            }
                        }
                        if (utils_1.isAsyncIterable(operationResult)) {
                            /** multiple emitted results */
                            ctx.subscriptions[id] = operationResult;
                            try {
                                for (var operationResult_1 = __asyncValues(operationResult), operationResult_1_1; operationResult_1_1 = await operationResult_1.next(), !operationResult_1_1.done;) {
                                    const result = operationResult_1_1.value;
                                    await emit.next(result, execArgs);
                                }
                            }
                            catch (e_1_1) { e_1 = { error: e_1_1 }; }
                            finally {
                                try {
                                    if (operationResult_1_1 && !operationResult_1_1.done && (_a = operationResult_1.return)) await _a.call(operationResult_1);
                                }
                                finally { if (e_1) throw e_1.error; }
                            }
                        }
                        else {
                            /** single emitted result */
                            // if the client completed the subscription before the single result
                            // became available, he effectively canceled it and no data should be sent
                            if (id in ctx.subscriptions)
                                await emit.next(operationResult, execArgs);
                        }
                        // lack of subscription at this point indicates that the client
                        // completed the subscription, he doesnt need to be reminded
                        await emit.complete(id in ctx.subscriptions);
                        delete ctx.subscriptions[id];
                        break;
                    }
                    case message_1.MessageType.Complete: {
                        await ((_c = (_b = ctx.subscriptions[message.id]) === null || _b === void 0 ? void 0 : _b.return) === null || _c === void 0 ? void 0 : _c.call(_b));
                        delete ctx.subscriptions[message.id]; // deleting the subscription means no further activity should take place
                        break;
                    }
                    default:
                        throw new Error(`Unexpected message of type ${message.type} received`);
                }
            });
            // wait for close, cleanup and the disconnect callback
            return async (code, reason) => {
                var _a;
                if (connectionInitWait)
                    clearTimeout(connectionInitWait);
                for (const sub of Object.values(ctx.subscriptions)) {
                    await ((_a = sub === null || sub === void 0 ? void 0 : sub.return) === null || _a === void 0 ? void 0 : _a.call(sub));
                }
                if (ctx.acknowledged)
                    await (onDisconnect === null || onDisconnect === void 0 ? void 0 : onDisconnect(ctx, code, reason));
                await (onClose === null || onClose === void 0 ? void 0 : onClose(ctx, code, reason));
            };
        },
    };
}
exports.makeServer = makeServer;
