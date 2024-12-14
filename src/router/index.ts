import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/settings',
            name: 'settings',
            // route level code-splitting
            // this generates a separate chunk (About.[hash].js) for this route
            // which is lazy-loaded when the route is visited.
            component: () => import('../views/SettingsView.vue'),
        },
        // {
        //     path: '/edit/:index',
        //     name: 'edit',
        //     component: () => import('../views/EditAction.vue'), // Ensure this component exists
        //     props: (route) => {
        //         const index = parseInt(route.params.index as string, 10);
        //         const baseActionType = route.params.baseActionType as BaseActionType;
        //         const action = actions[index]; // Retrieve the action based on the index
        //         if (action) {
        //             return { action };
        //         } else {
        //             // Handle case where action does not exist (optional)
        //             throw new Error(`Action with index ${index} not found`);
        //         }
        //     },
        // },
    ],
})

export default router
