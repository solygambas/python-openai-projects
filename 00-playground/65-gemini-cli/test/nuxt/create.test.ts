import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

// component imports
import Create from '../../app/pages/create.vue'

describe('CreatePage', () => {
  it('should submit the form with the correct values', async () => {
    const wrapper = await mountSuspended(Create)
    const consoleSpy = vi.spyOn(console, 'log')

    await wrapper.find('#foodOne').setValue('Marmite')
    await wrapper.find('#foodTwo').setValue('Cheese')
    await wrapper.find('#description').setValue('A classic savory delight.')
    await wrapper.find('#tags').setValue('savory, classic')

    await wrapper.find('form').trigger('submit.prevent')

    expect(consoleSpy).toHaveBeenCalledWith('New Combo Data:', {
      foodOne: 'Marmite',
      foodTwo: 'Cheese',
      description: 'A classic savory delight.',
      tags: ['savory', 'classic'],
    })
  })
})
