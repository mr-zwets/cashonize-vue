<script setup lang="ts">
  import bchWalletView from "./components/bchWallet.vue"
  import HelloWorld from './components/HelloWorld.vue'
  import { ref, onMounted } from 'vue'
  import { TestNetWallet, BaseWallet, BalanceResponse } from "mainnet-js"

  // reactive state
  const wallet = ref(null as (TestNetWallet | null));
  const balance = ref(0 as (number | undefined));
  const nrTokenCategories = ref(0 as (number | undefined));

  onMounted(async()=>{
    //BaseWallet.StorageProvider = IndexedDBProvider ;
    wallet.value = await TestNetWallet.fromSeed("", "m/44'/0'/0'/0/0") as TestNetWallet;
    const walletBalance = await wallet.value.getBalance() as BalanceResponse;
    const getFungibleTokensResponse = await wallet.value.getAllTokenBalances();
    const getNFTsResponse = await wallet.value.getAllNftTokenBalances();
    let tokenCategories = Object.keys({...getFungibleTokensResponse, ...getNFTsResponse})
    // update state
    balance.value = walletBalance.sat;
    nrTokenCategories.value = tokenCategories.length;
  })
</script>

<template>
  <main>
    <div class="wrapper">
      <HelloWorld msg="Cashonize-Vue" />
    </div>
    <nav style="display: flex; margin: 20px 0px;">
      <div style="padding: 0px 10px;">BchWallet</div>
      <div style="padding: 0px 10px;">MyTokens</div>
    </nav>
    <bchWalletView :wallet="(wallet as TestNetWallet)" :balance="balance" :nrTokenCategories="nrTokenCategories"/>
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
