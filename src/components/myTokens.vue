
<script setup lang="ts">
  import tokenItem from './tokenItem.vue'
  import { useStore } from '../store'
  const store = useStore()

  defineProps<{
    nrBcmrRegistries: number| undefined,
  }>()
</script>

<template>
  <div v-if="nrBcmrRegistries == undefined">Loading tokendata ...</div>
  <div v-if="store.tokenList?.length == 0"> No tokens in Wallet </div>
  <div v-if="nrBcmrRegistries != undefined">
    <div v-for="tokenData in store.tokenList" :key="tokenData.tokenId.slice(0,6)">
      <tokenItem :tokenData="tokenData"/>
    </div>
  </div>
</template>