export const KAFKA_BROKER = process.env.KAFKA_BROKER ?? 'localhost:9092';

export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID ?? 'eventflow-app';

export const KAFKA_CONSUMER_GROUP_ID =
  process.env.KAFKA_CONSUMER_GROUP_ID ?? 'eventflowapp-consumer';

export const KAFKA_TOPICS = {
  // Auth events
    USER_REGISTERED: 'user-registered',
    USER_LOGGED_IN: 'user-logged-in',
    USER_LOGGED_OUT: 'user-logged-out',
    USER_UPDATED: 'user-updated',
    USER_DELETED: 'user-deleted',
    PASSWORD_RESET_REQUESTED: 'password-reset-requested',

    // Event events
    EVENT_CREATED: 'event-created',
    EVENT_UPDATED: 'event-updated',
    EVENT_DELETED: 'event-deleted',

    // Ticket events
    TICKET_CREATED: 'ticket-created',
    TICKET_UPDATED: 'ticket-updated',
    TICKET_DELETED: 'ticket-deleted',
    TICKET_SOLD: 'ticket-sold',
    TICKET_CANCELLED: 'ticket-cancelled',
    TICKET_REFUNDED: 'ticket-refunded',
    TICKET_PURCHASED: 'ticket-purchased',
    TICKET_CHECKED_IN: 'ticket-checked-in',

    // Payment events
    PAYMENT_INITIATED: 'payment-initiated',
    PAYMENT_COMPLETED: 'payment-completed',
    PAYMENT_FAILED: 'payment-failed',
    PAYMENT_CANCELLED: 'payment-cancelled',
    // Notification events
    SEND_PUSH_NOTIFICATION: 'send-push-notification',
    SEND_EMAIL_NOTIFICATION: 'send-email-notification',
} as const;


export type KafkaTopic = typeof KAFKA_TOPICS[keyof typeof KAFKA_TOPICS];