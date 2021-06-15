import { EventNames, EventParams, EventsMap, StrictEventEmitter } from './utils/typed-events'

export default class Messager<
  ListenEvents extends EventsMap,
  EmitEvents extends EventsMap,
  ReservedEvents extends EventsMap = {}
> extends StrictEventEmitter<ListenEvents, EmitEvents, ReservedEvents> {
  constructor() {
    super()
    window.addEventListener('message', this.recvMessage)
  }

  emit<Ev extends EventNames<EmitEvents>>(ev: Ev, ...args: EventParams<EmitEvents, Ev>): boolean {
    this.postMessage([ev.toString(), ...args])
    return true
  }

  dispose() {
    window.removeEventListener('message', this.recvMessage)
  }

  private recvMessage = ({ data }: MessageEvent<[string, ...any]>) => {
    if (!Array.isArray(data)) {
      return
    }
    const [ev, ...args] = data
    this.emitReserved(ev, ...(args as any))
  }

  private postMessage(e: [string, ...any]) {
    const inAppWebView = (window as any).flutter_inappwebview
    if (typeof inAppWebView !== 'undefined') {
      inAppWebView.callHandler('postMessage', ...e)
    } else if (window.parent !== window) {
      window.parent.postMessage(e, '*')
    }
  }
}
