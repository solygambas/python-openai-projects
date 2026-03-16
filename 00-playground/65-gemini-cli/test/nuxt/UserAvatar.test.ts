import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import UserAvatar from '../../app/components/UserAvatar.vue'

describe('UserAvatar', () => {
  it('renders the initial prop', async () => {
    const component = await mountSuspended(UserAvatar, {
      props: {
        initial: 'A'
      }
    })
    expect(component.text()).toBe('A')
  })

  it('applies the correct background color class', async () => {
    const component = await mountSuspended(UserAvatar, {
      props: {
        initial: 'A',
        bgColor: 'primary'
      }
    })
    expect(component.classes()).toContain('bg-primary')
  })

  it('renders as a circle', async () => {
    const component = await mountSuspended(UserAvatar, {
      props: {
        initial: 'A'
      }
    })
    expect(component.classes()).toContain('avatar-circle')
  })

  it('uses default background color if none provided', async () => {
    const component = await mountSuspended(UserAvatar, {
      props: {
        initial: 'A'
      }
    })
    expect(component.classes()).toContain('bg-default')
  })
})
