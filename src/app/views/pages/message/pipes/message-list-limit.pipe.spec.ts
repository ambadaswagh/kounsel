import { MessageListLimitPipe } from './message-list-limit.pipe';

describe('MessageListLimitPipe', () => {
  it('create an instance', () => {
    const pipe = new MessageListLimitPipe();
    expect(pipe).toBeTruthy();
  });
});
