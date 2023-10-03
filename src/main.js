import './style.css'
import Camera from 'simple-vue-camera'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
const app = createApp(App)

app.use(router)
app.component("camera", Camera)
app.mount('#app')
