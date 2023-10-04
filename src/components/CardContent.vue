<template>
    <div class="flex flex-col max-w-[600px] max-sm:w-[350px] bg-blue-500 mx-auto text-center rounded-lg">
        <div class="flex justify-between items-center px-5">
            <h1 class="text-center py-5 font-bold">Camera Attendance</h1>
            <p class="font-bold">Hi! {{ this.$route.query.username }}</p>
        </div>
        <hr>
        <div>
            <camera 
                :resolution="{width: 375, heigh: 812}" 
                autoplay 
                ref="cameraRef"
            >
            </camera>
        </div>
        <select 
            class="font-bold px-3 py-2"
            v-model="selectedCamera" 
            @change="changeCameraCam"
        >
            <option 
                v-for="device in availableCameras" 
                :key="device.deviceId" 
                :value="device.deviceId"
            >
                {{ device.label }}
            </option>
        </select>
        <hr>
        <div class="flex max-sm:flex-col items-center">
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
                    width="320"
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
import { getDatabase, ref, push } from 'firebase/database';

export default {
    name: 'CardComponent',

    data() {
        return {
            snapshotUrl: null,
            geolocationData: null,
            geolocation: useGeolocation(),
            formattedDate: null,
            address: null,
            selectedCamera: null, // to store the selected cam devices ID
            availableCameras: [] // to store the list of avail cam
        }
    },

    mounted() {
        let cameras = this.$refs.cameraRef.devices(['videoinput']);
        cameras.then((result) => {
            this.availableCameras = result
            this.selectedCamera = result[0].deviceId
        }).catch((err) => {
            console.log(err)
        });
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
        },

        async changeCameraCam() {
            const camera = this.$refs.cameraRef;

            if (camera && this.selectedCamera) {
                try {
                    await camera.changeCamera(this.selectedCamera);
                } catch (error) {
                    console.error('Error change cam:', error);
                }
            }
        },

        sendAttend() {
            const db = getDatabase();
            const attendancesRef = ref(db, 'attendances/AllDataAttendance'); // Change 'attendances' to your desired Firebase path

            const newAttendance = {
                username: this.$route.query.username,
                address: this.address,
                formattedDate: this.formattedDate,
                image: this.snapshotUrl
            };

        try {
            // Push the new attendance data to Firebase
            push(attendancesRef, newAttendance)
                .then(() => {
                    console.log('Attendance data sent successfully');
                    // You can add any further actions here after sending the data
                })
                .catch((error) => {
                    console.error('Error sending attendance data:', error);
                });
            } catch (error) {
                console.error('Error sending attendance data:', error);
            }
        }
    }
}

</script>