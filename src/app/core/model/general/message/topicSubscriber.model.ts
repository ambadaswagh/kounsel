export interface TopicSubscriber extends Account {
    subscribed_as: SubscribedAs,
    subscription_status: number,
    subscription_type: number,
    user_id?: any,
    image_url?: any
}

enum SubscribedAs {
    HOST = 2,
    SERVICE_PROVIDER = 3
}