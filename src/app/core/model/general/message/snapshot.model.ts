import { Conversation } from './conversation.model';
import { TopicSubscription } from './topicSubscription.model';
import { TopicSubscriber } from './topicSubscriber.model';
import { Topic } from './topic.model';

export interface SnapShot {
    'chat'?: Conversation,
    'subscription'?: TopicSubscription,
    'subscribers'?: TopicSubscriber[],
    'topic'?: Topic

    // ******** UI ******* //
    'opened'?: boolean,
    'groupChat'?: boolean,
    'currUser'?: TopicSubscriber,
    'otherUser'?: TopicSubscriber,
    'otherUsers'?: TopicSubscriber[],
}