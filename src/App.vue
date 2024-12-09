<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
    <main class="form-signin w-100 m-auto">
        <div class="container">
            <div class="row justify-content-center align-items-center">
                <div class="col-md-10 col-lg-10 col-xl-8">
                    <RouterView />
                </div>
            </div>
        </div>
    </main>
</template>
