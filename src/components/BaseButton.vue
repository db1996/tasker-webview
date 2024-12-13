<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { PropType, ButtonHTMLAttributes } from 'vue'
import { RouterLink } from 'vue-router'
import MdiIcon from './MdiIcon.vue'
import { useTaskerClient } from '@/stores/useTaskerClient'

const taskerClient = useTaskerClient().taskerClient

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
    checkrunning: {
        type: Boolean,
        default: false,
    },
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

const overwriteDisabled = ref(props.loading)

onMounted(() => {
    if (props.checkrunning) {
        watch(
            () => taskerClient.isRunning, // Use a function to track `route.query.edit`
            () => {
                overwriteDisabled.value = taskerClient.isRunning
            },
        )
    }
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
        :disabled="loading || overwriteDisabled"
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
        :disabled="loading || overwriteDisabled"
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
