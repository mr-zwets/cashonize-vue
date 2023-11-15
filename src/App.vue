<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { Wallet } from "mainnet-js"
  import HelloWorld from './components/HelloWorld.vue'

  // reactive state
  const wallet = ref(null as (Wallet | null)) 

  // functions that mutate state and trigger updates
  onMounted(async()=>{
    wallet.value = await Wallet.newRandom() as Wallet;
  })
</script>

<template>
  <header>
    
  </header>

  <main>
    <div class="wrapper">
      <HelloWorld msg="Vue + Typescript + mainnet-js" />
    </div>
    <br>
    <div> {{ wallet?.address ?? "" }} </div>
    <br>
    <div> {{ wallet?.tokenaddr ?? "" }} </div>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
