<script setup lang="ts">
import MdiIcon from './MdiIcon.vue'

defineProps({
    to: {
        type: String,
        default: '#',
    },
    icon: {
        type: String,
        required: false,
    },
    txt: {
        type: String,
        required: false,
    },
})
</script>
<template>
    <li>
        <a class="dropdown-item" :href="to">
            <MdiIcon v-if="icon" :icon="icon" class="me-2" />
            <slot v-if="$slots.default" />
            <template v-else>
                {{ txt }}
            </template>
        </a>
    </li>
</template>
