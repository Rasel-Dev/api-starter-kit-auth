import EventEmitter from 'events'

type ActivityType = {
  info: (logData: string) => void
  warn: (logData: string) => void
  error: (logData: Record<string, string>, formate: string) => void
}

class ActivityEvent<T extends Record<string, any>> {
  private emitter: EventEmitter

  constructor(emitter: EventEmitter) {
    this.emitter = emitter
  }
  /**
   * Represents a list-based question.
   *
   * @template E
   * The type of the key.
   *
   * @template T
   * The valid choices for the methods.
   */
  public notify<E extends keyof T>(event: E, ...body: Parameters<T[E]>) {
    this.emitter.emit(event.toString(), body)
  }
  /**
   * Event listener
   */
  public listen<E extends keyof T>(event: E, listener: (data: Parameters<T[E]>) => void) {
    this.emitter.on(event.toString(), listener)
  }
}

const monitorEvent = new ActivityEvent<ActivityType>(new EventEmitter())
export default monitorEvent
