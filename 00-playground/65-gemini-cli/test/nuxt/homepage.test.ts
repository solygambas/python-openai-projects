import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import Index from '../../app/pages/index.vue';

describe('Homepage', () => {
  it('should render the h1 title', async () => {
    const wrapper = await mountSuspended(Index);
    expect(wrapper.find('h1').text()).toBe('The perfect pair for your plate.');
  });
});
