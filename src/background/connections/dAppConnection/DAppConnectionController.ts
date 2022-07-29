import { DEFERRED_RESPONSE } from './../middlewares/models';
import { resolve } from '@avalabs/utils-sdk';
import {
  connectionLog,
  disconnectLog,
  eventLog,
  responseLog,
} from '@src/utils/logging';
import { injectable, injectAll } from 'tsyringe';
import { Runtime } from 'webextension-polyfill-ts';
import { Context, Pipeline } from '../middlewares/models';
import { PermissionMiddleware } from '../middlewares/PermissionMiddleware';
import { DAppRequestHandlerMiddleware } from '../middlewares/DAppRequestHandlerMiddleware';
import {
  LoggerMiddleware,
  SideToLog,
} from '../middlewares/RequestLoggerMiddleware';
import { SiteMetadataMiddleware } from '../middlewares/SiteMetadataMiddleware';
import {
  ConnectionController,
  DAppEventEmitter,
  DAppRequestHandler,
  ExtensionConnectionEvent,
  ExtensionConnectionMessage,
} from '../models';
import { RequestProcessorPipeline } from '../RequestProcessorPipeline';
import { INPAGE_PROVIDER } from '@src/common';
import { PermissionsService } from '@src/background/services/permissions/PermissionsService';
import { AccountsService } from '@src/background/services/accounts/AccountsService';

import './registry';
import { RPCCallsMiddleware } from '../middlewares/RPCCallsMiddleware';
import { NetworkService } from '@src/background/services/network/NetworkService';

/**
 * This needs to be a controller per dApp, to separate messages
 * Do not make it a singleton otherwise dApps would potentially get each other's messages
 */
@injectable()
export class DAppConnectionController implements ConnectionController {
  private pipeline?: Pipeline;
  private connection?: Runtime.Port;

  constructor(
    @injectAll('DAppRequestHandler') private handlers: DAppRequestHandler[],
    @injectAll('DAppEventEmitter') private eventEmitters: DAppEventEmitter[],
    private permissionsService: PermissionsService,
    private accountsService: AccountsService,
    private networkService: NetworkService
  ) {
    this.onMessage = this.onMessage.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.onEvent = this.onEvent.bind(this);
  }

  connect(connection: Runtime.Port) {
    this.connection = connection;
    this.pipeline = RequestProcessorPipeline(
      LoggerMiddleware(SideToLog.REQUEST),
      SiteMetadataMiddleware(connection),
      RPCCallsMiddleware(this.networkService),
      PermissionMiddleware(this.permissionsService, this.accountsService),
      DAppRequestHandlerMiddleware(this.handlers, this.networkService),
      LoggerMiddleware(SideToLog.RESPONSE)
    );

    connectionLog('dApp Provider');

    this.connection.onMessage.addListener(this.onMessage);
    this.connection.onDisconnect.addListener(this.disconnect);
    this.eventEmitters.forEach((emitter) => {
      emitter.addListener(this.onEvent);
      emitter.setConnectionInfo({
        domain: new URL(this.connection?.sender?.url || '').hostname,
        tabId: connection.sender?.tab?.id,
      });
    });
  }

  disconnect() {
    this.connection?.onMessage.removeListener(this.onMessage);
    this.eventEmitters.forEach((emitter) =>
      emitter.removeListener(this.onEvent)
    );
    disconnectLog('dApp Provider');
  }

  needToPost(context: Context): boolean {
    return context.response !== DEFERRED_RESPONSE;
  }

  private async onMessage(request: ExtensionConnectionMessage) {
    if (!this.pipeline || !this.connection) {
      throw Error('dAppConnectionController is not connected to a port');
    }

    const [context, error] = await resolve(
      this.pipeline.execute({
        // always start with authenticated false, middlewares take care of context updates
        authenticated: false,
        request: request,
      })
    );

    if (error) {
      const response = {
        ...request,
        data: {
          ...request.data,
          ...{ error },
        },
      };
      responseLog(`Web3 response (${request.data.method})`, response);
      this.connection.postMessage(response);
      return;
    } else if (context) {
      if (this.needToPost(context)) {
        this.connection.postMessage(context.response);
      }
    }
  }

  private onEvent(evt: ExtensionConnectionEvent) {
    eventLog('Web 3 Event', evt);
    try {
      this.connection?.postMessage({ name: INPAGE_PROVIDER, data: evt });
    } catch (e) {
      console.error(e);
    }
  }
}