<template>
    <div class="flex flex-col max-w-[600px] bg-blue-500 mx-auto text-center rounded-lg">
        <h1 class="text-center py-5 font-bold">Camera Attendance</h1>
        <hr>
        <div>
            <camera 
                :resolution="{width: 375, heigh: 812}" 
                autoplay 
                ref="cameraRef"
            ></camera>
        </div>
        <hr>
        <div class="flex items-center">
            <div class="text-left pl-4 w-full py-4 flex flex-col">
                <h1><span class="font-bold">DATE:</span> {{ formattedDate }}</h1>
                <h1><span class="font-bold">LOCATION:</span> {{ address }}</h1>
            </div>
            <div class="flex px-4 py-4">
                <img 
                    class="rounded-lg shadow-lg"
                    :src="snapshotUrl" 
                    v-if="snapshotUrl"
                    alt="Snapshot" 
                    width="300"
                />
            </div>
        </div>
        <div class="pb-5 space-x-3">
            <button
                @click="takeSnapshot"
                class="py-2 px-8 bg-green-500 rounded-lg"
            >
                <h1 class="font-bold text-[14px]">Capture</h1>
            </button>
            <button
                @click="sendAttend"
                class="py-2 px-8 bg-blue-900 rounded-lg"
            >
                <h1 class="font-bold text-[14px] text-white">Send Attend</h1>
            </button>
        </div>
    </div>
</template>

<script>
import {useGeolocation} from '@vueuse/core';
import axios from 'axios';

export default {
    name: 'CardComponent',

    data() {
        return {
            snapshotUrl: null,
            geolocationData: null,
            geolocation: useGeolocation(),
            formattedDate: null,
            address: null,
        }
    },

    watch: {
    geolocation: {
      deep: true,
      handler(value) {
        this.geolocationData = JSON.stringify(
          {
            coords: {
              accuracy: value.coords.accuracy,
              latitude: value.coords.latitude,
              longitude: value.coords.longitude,
              altitude: value.coords.altitude,
              altitudeAccuracy: value.coords.altitudeAccuracy,
              heading: value.coords.heading,
              speed: value.coords.speed,
            },
                locatedAt: value.locatedAt,
                error: value.error ? value.error.message : value.error,
            },
                null,
                2
            );
        },
        },
    },

    computed: {
        latitude() {
            return this.geolocation.coords ? this.geolocation.coords.latitude : null;
        },
        longitude() {
            return this.geolocation.coords ? this.geolocation.coords.longitude : null;
        },
    },

    methods: {
        async takeSnapshot() {
            const camera = this.$refs.cameraRef;

            if(camera) {
                const blob = await camera.snapshot({width: 1920, height: 1080}, "image/png", 0.5);
                if(blob) {
                    this.snapshotUrl = URL.createObjectURL(blob);
                    this.timeAttend();
                    this.getStreetName();
                }
            }
        },

        timeAttend() {
            const currentDate = new Date();
            const options = {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'}
            this.formattedDate = currentDate.toLocaleDateString('en-US', options)
        },

        async getStreetName() {
            const latitude = this.latitude
            const longitude = this.longitude
            try {
                const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            if (response.data && response.data.display_name) {
                const streetName = response.data.display_name;
                this.address = streetName;
            } else {
                console.error('Invalid response from the geocoding API.');
            }
            
            } catch (error) {
                console.error('Error fetching data from the geocoding API:', error);
            }
        }
    }
}

</script>