
<script setup lang="ts">
  import tokenItem from './tokenItem.vue'
  import { Wallet, TestNetWallet } from "mainnet-js"
  import type { TokenData } from "../interfaces/interfaces"

  defineProps<{
    wallet: Wallet | TestNetWallet | null,
    tokenList: Array<TokenData> | null,
    bcmrRegistries: any[] | undefined,
    chaingraph: string,
    ipfsGateway: string
  }>()
</script>

<template>
  <div v-if="!tokenList || !bcmrRegistries">Loading tokendata ...</div>
  <div v-if="tokenList?.length == 0"> No tokens in Wallet </div>
  <div v-if="bcmrRegistries?.length">
    <div  v-for="tokenData in tokenList" :key="tokenData.tokenId">
      <tokenItem :wallet="wallet" :tokenData="tokenData" :bcmrRegistries="bcmrRegistries" :chaingraph="chaingraph" :ipfsGateway="ipfsGateway"/>
    </div>
  </div>
</template>