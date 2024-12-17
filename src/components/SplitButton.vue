<script setup lang="ts">
import BaseButton from './BaseButton.vue'

const props = defineProps({
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
</script>
<template>
    <div class="btn-group">
        <BaseButton v-bind="props" type="button" />
        <BaseButton
            :btn-class="btnClass + ' dropdown-toggle dropdown-toggle-split'"
            data-bs-toggle="dropdown"
            aria-expanded="false"
        />
        <ul class="dropdown-menu">
            <slot />
        </ul>
    </div>
</template>
