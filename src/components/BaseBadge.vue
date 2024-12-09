<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
    text: String,
    type: {
        type: String,
        default: 'primary',
    },
    pill: {
        type: Boolean,
        default: false,
    },
    subtile: {
        type: Boolean,
        default: false,
    },
    fs: {
        type: String,
        default: '',
    },
    me: {
        type: String,
        default: '',
    },
})

const badgeClasses = computed(() => {
    const classes = ['badge']
    if (props.subtile) {
        classes.push(`text-bg-${props.type}-subtle`)
    } else {
        classes.push(`text-bg-${props.type}`)
    }

    if (props.fs) {
        classes.push(`fs-${props.fs}`)
    }

    if (props.me) {
        classes.push(`me-${props.me}`)
    }

    if (props.pill) {
        classes.push('rounded-pill')
    }

    return classes
})
</script>

<template>
    <span :class="badgeClasses">
        {{ props.text }}
    </span>
</template>
