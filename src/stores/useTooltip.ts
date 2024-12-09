import { defineStore } from 'pinia'

interface HTMLElement {
    _tooltipObserver?: MutationObserver
}
import { Tooltip } from 'bootstrap'

import { debounce } from 'lodash'

const useTooltipStore = defineStore('tooltips', {
    state: () => ({
        tooltipElements: [] as HTMLElement[],
    }),
    actions: {
        createToolTip(el: HTMLElement) {
            if (el && !this.tooltipElements.includes(el)) {
                Tooltip.getOrCreateInstance(el as Element)
                this.tooltipElements.push(el)
            }
        },
        destroyToolTip(el: HTMLElement) {
            const tooltipInstance = Tooltip.getOrCreateInstance(el as Element)
            if (tooltipInstance) {
                tooltipInstance.dispose()
                this.tooltipElements = this.tooltipElements.filter((tooltip) => tooltip !== el)
            }
        },
    },
})

// Create a tooltip directive that can be registered globally
export const tooltipDirective = {
    mounted(el: HTMLElement) {
        const store = useTooltipStore()
        store.createToolTip(el)

        const updateWindowWidth = debounce((element) => {
            element.setAttribute('data-bs-original-title', element.attributes['data-title'].value)
            store.destroyToolTip(element)
            store.createToolTip(element)
        }, 100)
        updateWindowWidth(el)

        // Create a MutationObserver to detect changes to data attributes
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation?.type === 'attributes' && mutation?.attributeName == 'data-title') {
                    updateWindowWidth(el)
                }
            }
        })

        // Observe changes to attributes on the element
        observer.observe(el as Node, { attributes: true })

        // Store the observer so it can be cleaned up on unmount
        el._tooltipObserver = observer
    },
    beforeUnmount(el: HTMLElement) {
        const store = useTooltipStore()
        store.destroyToolTip(el)

        // Disconnect the MutationObserver when the element is unmounted
        if (el._tooltipObserver) {
            el._tooltipObserver.disconnect()
            delete el._tooltipObserver
        }
    },
}

export default useTooltipStore
