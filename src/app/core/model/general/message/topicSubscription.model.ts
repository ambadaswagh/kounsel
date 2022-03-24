export interface TopicSubscription {
    'last_update': string,
    'status': number,
    'time': string,
    'topic_id': string,
    'type': SubscriptionType,
    'unread_count': number,
    'user_id': string,
    '_last_update': number,
    '_time': number,
}

enum SubscriptionType {
    OWNER = 2,
    ADMIN = 3,
    MEMBER = 5
}