<template>
  <div class="wrap">
    <div class="home" @click="aa">
      <img alt="Vue logo" src="../assets/logo.png" />
      <HelloWorld v-show="false" msg="Welcome to Your Vue.js App" />
    </div>
    <div class="home" @click="aa">
      <img alt="Vue logo" src="../assets/logo.png" />
      <HelloWorld v-show="false" msg="Welcome to Your Vue.js App" />
    </div>
    <div class="home" @click="aa">
      <img alt="Vue logo" src="../assets/logo.png" />
      <HelloWorld v-show="false" msg="Welcome to Your Vue.js App" />
    </div>
    <div class="home" @click="aa">
      <img alt="Vue logo" src="../assets/logo.png" />
      <HelloWorld v-show="false" msg="Welcome to Your Vue.js App" />
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";

export default {
  name: "HomeView",
  components: {
    HelloWorld,
  },
  methods: {
    aa() {
      this.$router.push("about");
    },
  },
};
</script>
<style>
@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }

  to {
    background-position: 0 50%;
  }
}
.wrap {
  padding: 20px;
}
.home {
  background: linear-gradient(-45deg, #f1f2f3 25%, #ffffff 45%, #f1f2f3 65%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.2s ease-in-out infinite;
  margin-bottom: 20px;
}
.home img {
  visibility: hidden;
}
</style>
