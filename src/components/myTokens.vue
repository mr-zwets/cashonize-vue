
<script setup lang="ts">
  import tokenItem from './tokenItem.vue'
  import type { TokenData } from "../interfaces/interfaces"

  defineProps<{
    tokenList: Array<TokenData> | null,
    nrBcmrRegistries: number| undefined,
  }>()
</script>

<template>
  <div v-if="nrBcmrRegistries == undefined">Loading tokendata ...</div>
  <div v-if="tokenList?.length == 0"> No tokens in Wallet </div>
  <div v-if="nrBcmrRegistries != undefined">
    <div v-for="tokenData in tokenList" :key="tokenData.tokenId.slice(0,6)">
      <tokenItem :tokenData="tokenData"/>
    </div>
  </div>
</template>