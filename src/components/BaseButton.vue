<script setup lang="ts">
import { computed } from 'vue'
import type { PropType, ButtonHTMLAttributes } from 'vue'
import { RouterLink } from 'vue-router'
import MdiIcon from './MdiIcon.vue'

const props = defineProps({
    type: {
        type: String as PropType<ButtonHTMLAttributes['type']>,
        default: 'button',
    },
    btnClass: {
        type: String,
        default: 'btn-primary',
    },
    loading: Boolean,
    disabled: Boolean,
    lift: Boolean,
    text: String,
    to: String,
    method: String,
    iconLeft: String,
    sm: Boolean,
    iconLeftMargin: {
        type: String,
        default: '',
    },
    iconRight: String,
    iconRightMargin: {
        type: String,
        default: '',
    },
    data: Object,
})

const computedClass = computed(() => {
    const btnClasses = []

    btnClasses.push(props.btnClass)

    if (props.lift && !props.disabled && !props.loading) {
        btnClasses.push('lift')
    }

    if (props.disabled || props.loading) {
        btnClasses.push('cursor-not-allowed')
    }

    if (props.sm) {
        btnClasses.push('btn-sm')
    }

    return btnClasses.join(' ')
})
</script>

<template>
    <RouterLink
        v-if="to"
        :to="to"
        class="btn"
        :class="computedClass"
        :method="method"
        :data="data"
        :disabled="loading || disabled"
    >
        <MdiIcon v-show="!loading" :icon="iconLeft" :class="iconLeftMargin" />
        <MdiIcon v-show="loading" icon="loading" spin />

        <slot v-if="$slots.default" />
        <template v-else>
            {{ text }}
        </template>

        <MdiIcon v-show="iconRight" :icon="iconRight" :class="iconRightMargin" />
    </RouterLink>

    <button
        v-else
        :type="props.type"
        class="btn"
        :class="computedClass"
        :disabled="loading || disabled"
    >
        <MdiIcon v-show="!loading" :icon="iconLeft" :class="iconLeftMargin" />
        <MdiIcon v-show="loading" icon="loading" spin />

        <slot v-if="$slots.default" />
        <template v-else>
            {{ text }}
        </template>

        <MdiIcon v-show="iconRight" :icon="iconRight" :class="iconRightMargin" />
    </button>
</template>
