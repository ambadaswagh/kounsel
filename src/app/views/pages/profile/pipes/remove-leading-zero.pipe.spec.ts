import { RemoveLeadingZeroPipe } from './remove-leading-zero.pipe';

describe('RemoveLeadingZeroPipe', () => {
  it('create an instance', () => {
    const pipe = new RemoveLeadingZeroPipe();
    expect(pipe).toBeTruthy();
  });
});
