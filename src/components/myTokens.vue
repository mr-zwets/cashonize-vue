
<script setup lang="ts">
  import tokenItem from './tokenItem.vue'
  import { Wallet, TestNetWallet  } from "mainnet-js"

  interface TokenData{
    tokenId: string,
    amount: number
  }

  defineProps<{
    wallet: Wallet | TestNetWallet | null,
    tokenList: Array<TokenData> | null,
    bcmrRegistries: any[],
    chaingraph: string,
  }>()
</script>

<template>
  <div v-if="!tokenList || !bcmrRegistries.length">Loading tokendata ...</div>
  <div v-if="bcmrRegistries.length">
    <div  v-for="tokenData in tokenList" :key="tokenData.tokenId">
      <tokenItem :wallet="wallet" :tokenData="tokenData" :bcmrRegistries="bcmrRegistries" :chaingraph="chaingraph"/>
    </div>
  </div>
</template>