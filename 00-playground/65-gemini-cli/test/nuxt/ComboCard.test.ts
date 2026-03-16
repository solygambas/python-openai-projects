import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ComboCard from '../../app/components/ComboCard.vue'

describe('ComboCard', () => {
  it('renders title, description and tags', () => {
    const wrapper = mount(ComboCard, {
      props: {
        title: 'Marmite & Cheese',
        description: 'A classic savory delight, loved by many.',
        tags: ['Savory', 'Classic']
      }
    })
    
    expect(wrapper.find('.combo-title').text()).toBe('Marmite & Cheese')
    expect(wrapper.find('.combo-description').text()).toBe('A classic savory delight, loved by many.')
    expect(wrapper.findAll('.tag')).toHaveLength(2)
  })

  it('renders an image when provided', () => {
    const wrapper = mount(ComboCard, {
      props: {
        title: 'Marmite & Cheese',
        description: 'A classic savory delight, loved by many.',
        tags: ['Savory', 'Classic'],
        image: '/images/marmite-cheese.png'
      }
    })
    
    const img = wrapper.find('.combo-image')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/marmite-cheese.png')
    expect(img.attributes('alt')).toBe('Marmite & Cheese')
  })

  it('does not render an image when not provided', () => {
    const wrapper = mount(ComboCard, {
      props: {
        title: 'Marmite & Cheese',
        description: 'A classic savory delight, loved by many.',
        tags: ['Savory', 'Classic']
      }
    })
    
    expect(wrapper.find('.combo-image').exists()).toBe(false)
  })
})
