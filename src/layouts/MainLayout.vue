<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import MdiIcon from '@/components/MdiIcon.vue'

const props = defineProps({
    title: {
        type: String,
        required: false,
    },
    loading: {
        type: Boolean,
        default: false,
    },
})
</script>

<template>
    <div class="card">
        <div class="card-header">
            <div class="row">
                <div class="col-6 d-flex align-items-center justify-content-start">
                    <div class="button-space">
                        <slot name="headerButton" v-if="$slots.headerButton" />
                        <BaseButton
                            @click="$router.go(-1)"
                            btnClass=""
                            sm
                            icon-left="arrow-left"
                            v-else
                        />
                    </div>
                    <h3 class="card-title">
                        <slot v-if="$slots.title" name="title" />
                        <template v-else>
                            {{ props.title }}
                        </template>
                    </h3>
                </div>
                <div class="col-6 d-flex align-items-center justify-content-end">
                    <slot name="actions" />
                </div>
            </div>
        </div>
        <div class="card-body" :class="{ loading: loading }">
            <div class="loading-container" v-if="loading">
                <div class="loading-icon">
                    <MdiIcon icon="loading" spin font-size="1" />
                </div>
            </div>
            <slot />
        </div>
    </div>
</template>
