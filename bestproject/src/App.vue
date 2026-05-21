<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Inter:wght@300;400;500&display=swap');

* {
  box-sizing: border-box;
}

body {
  background: #0A0F1E !important;
}

.v-application {
  font-family: 'Inter', sans-serif !important;
  background: #0A0F1E !important;
}
</style>