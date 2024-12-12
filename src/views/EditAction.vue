<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue'
import MdiIcon from '@/components/MdiIcon.vue'
import MainLayout from '@/layouts/MainLayout.vue'
</script>

<template :key="key">
    <MainLayout title="Edit action" :loading="false">
        <template v-slot:headerButton></template>
        <template v-slot:actions>
            <MdiIcon icon="cog" />
            <BaseButton
                btnClass="btn-primary ms-2"
                sm
                icon-left="plus"
                v-tooltip
                data-title="Create action"
            />
            <BaseButton btnClass="btn-secondary ms-2" sm icon-left="cog" to="/settings" />
        </template>
        <template #default> </template>
    </MainLayout>
</template>
