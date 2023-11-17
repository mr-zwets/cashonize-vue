
<script setup lang="ts">
import { ref, onMounted } from 'vue'
  import tokenItem from './tokenItem.vue'
  import { Wallet, TestNetWallet  } from "mainnet-js"

  interface TokenData{
    tokenId: string,
    amount: number
  }

  const { tokenList } = defineProps<{
    tokenList: Array<TokenData> | null,
      chaingraph: string
  }>()
</script>

<template>
  <div v-if="tokenList === null">Loading tokendata ...</div>
  <div v-for="tokenData in tokenList" :key="tokenData.tokenId">
    <tokenItem :tokenData="tokenData" :chaingraph="chaingraph"/>
  </div>
</template>