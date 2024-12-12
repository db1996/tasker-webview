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
    size: {
        type: String,
        default: 'col-md-8',
    },
    dNone: {
        type: Boolean,
        default: false,
    },
    mainId: {
        type: String,
        default: 'main',
    },
})
</script>

<template>
    <main class="form-signin w-100 m-auto" :class="{ 'd-none': dNone }">
        <div class="container">
            <div class="row justify-content-center align-items-center">
                <div :class="size">
                    <div class="card" :id="mainId">
                        <div class="card-header">
                            <div class="row">
                                <div class="col-6 d-flex align-items-center justify-content-start">
                                    <div
                                        class="button-space"
                                        :class="{ 'd-none': !$slots.headerButton }"
                                    >
                                        <slot name="headerButton" v-if="$slots.headerButton" />
                                        <BaseButton
                                            @click="$router.go(-1)"
                                            btnClass=""
                                            sm
                                            icon-left="arrow-left"
                                            v-else
                                        />
                                    </div>
                                    <h5 class="card-title">
                                        <slot v-if="$slots.title" name="title" />
                                        <template v-else>
                                            {{ props.title }}
                                        </template>
                                    </h5>
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
                </div>
            </div>
        </div>
    </main>
</template>
