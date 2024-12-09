<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
    icon: String,
    spin: {
        type: Boolean,
        default: false,
    },
    rotate: {
        type: String,
        default: null,
    },
    flip: {
        type: String,
        default: null,
    },
    fontSize: {
        type: String,
        default: '',
    },
})

const classes = computed(() => {
    const iconClasses = ['mdi']

    iconClasses.push(`mdi-${props.icon}`)

    if (props.spin) {
        iconClasses.push('mdi-spin')
    }

    if (props.rotate) {
        iconClasses.push(`mdi-rotate-${props.rotate}`)
    }

    if (props.flip) {
        iconClasses.push(`mdi-flip-${props.flip}`)
    }

    if (props.fontSize.length > 0) {
        iconClasses.push(`fs-${props.fontSize}`)
    }

    return iconClasses.join(' ')
})
</script>

<template>
    <i :class="classes"></i>
</template>
